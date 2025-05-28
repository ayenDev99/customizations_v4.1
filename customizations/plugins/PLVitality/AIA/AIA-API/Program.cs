using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Topshelf;
using System.Net.Http.Headers;
using AIA_API;
using System.Net.NetworkInformation;
using System.Reflection;

static class Program
{
    static void Main()
    {
        var exitCode = HostFactory.Run(serviceConfig =>
        {
            serviceConfig.Service<ApiService>(serviceInstance =>
            {
                serviceInstance.ConstructUsing(() => new ApiService());
                serviceInstance.WhenStarted(service => service.Start());
                serviceInstance.WhenStopped(service => service.Stop());
            });

            serviceConfig.RunAsLocalSystem();
            serviceConfig.StartAutomatically();
            serviceConfig.EnableServiceRecovery(recoveryOption =>
            {
                recoveryOption.RestartService(1); // Restart service after 1 minute
                recoveryOption.RestartService(1);
                recoveryOption.RestartService(1);
                recoveryOption.OnCrashOnly();
            });

            serviceConfig.SetServiceName("AIAServices");
            serviceConfig.SetDisplayName("AIA API Services");
            serviceConfig.SetDescription("A Windows service that sends API request.");
        });

        Environment.ExitCode = (int)exitCode;
    }
}

public class ApiService
{
    private Timer _timer;
    private readonly HttpClient _client = new HttpClient();
    private readonly string _connectionString = "server=localhost;database=aia;user=root;password=sysadmin;port=3306;";
    private bool _isRunning = false;

    public void Start()
    {
        Console.WriteLine("Service Started...");
        _timer = new Timer(async _ => await TimerCallback(), null, TimeSpan.Zero, TimeSpan.FromSeconds(30));
    }

    public void Stop()
    {
        Console.WriteLine("Service Stopped...");
        _timer?.Change(Timeout.Infinite, 0);
        _timer?.Dispose();
    }

    private async Task TimerCallback()
    {
        if (_isRunning) return;
        _isRunning = true;

        try
        {
            await SendApiRequest();
        }
        finally
        {
            _isRunning = false;
        }
    }

    private bool IsInternetAvailable()
    {
        try
        {
            using (var ping = new Ping())
            {
                PingReply reply = ping.Send("8.8.8.8", 3000); // Google DNS
                return reply.Status == IPStatus.Success;
            }
        }
        catch
        {
            return false;
        }
    }

    private async Task SendApiRequest()
    {
        if (!IsInternetAvailable())
        {
            Console.WriteLine("Offline: Pending transactions will be sent when internet is back.");
            return;
        }

        try
        {
            List<Transaction> transactions = GetTransactionsFromDatabase();

            if (transactions.Count == 0)
            {
                Console.WriteLine("No transactions found to send.");
                return;
            }

            string token = await GetBearerToken();

            var requestData = new { transactions };
            string json = JsonSerializer.Serialize(requestData, new JsonSerializerOptions { WriteIndented = true });
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _client.DefaultRequestHeaders.Clear();
            _client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
            _client.DefaultRequestHeaders.Add("x-vitality-legal-entity-id", "8");
            _client.DefaultRequestHeaders.Add("x-aia-request-id", "TOBYSPORTSPH");

            string formattedUrl = $"https://qa.vitality.aia.com/vitality/partnerproxy/v1/transaction/bulk?partner-code=TOBYSPORTSPH&partner-sub-code=TOBSPRT&effective-date={DateTime.Now:yyyy-MM-dd}";

            HttpResponseMessage response = await _client.PostAsync(formattedUrl, content);
            string responseString = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"\n[{DateTime.Now}] Response: {responseString}");

            if (response.IsSuccessStatusCode)
            {
                UpdateTransactionStatus(transactions);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[{DateTime.Now}] Error: {ex.Message}");
        }
    }

    private void UpdateTransactionStatus(List<Transaction> transactions)
    {
        using (MySqlConnection conn = new MySqlConnection(_connectionString))
        {
            try
            {
                conn.Open();
                foreach (var transaction in transactions)
                {
                    string updateQuery = "UPDATE transactions SET status = 1 WHERE memberIdentifierReference = @memberIdentifierReference";
                    using (MySqlCommand cmd = new MySqlCommand(updateQuery, conn))
                    {
                        cmd.Parameters.AddWithValue("@memberIdentifierReference", transaction.memberIdentifierReference);
                        cmd.ExecuteNonQuery();
                    }
                }

                Console.WriteLine("Transaction statuses updated.");
            }
            catch (Exception ex)
            {
                Console.WriteLine("DB Update Error: " + ex.Message);
            }
        }
    }

    private static async Task<string> GetBearerToken()
    {
        string username = "0ceec2eaf7904c7f801f696c42537531";
        string password = "9710636eecdd4454944c4b63b233bd94";
        string credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));

        using (HttpClient client = new HttpClient())
        {
            client.DefaultRequestHeaders.Add("Authorization", $"Basic {credentials}");

            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "client_credentials")
            });

            HttpResponseMessage response = await client.PostAsync("https://qa.vitality.aia.com/vitality/security/v1/oauth2/token", content);

            if (response.IsSuccessStatusCode)
            {
                string responseString = await response.Content.ReadAsStringAsync();
                using (JsonDocument doc = JsonDocument.Parse(responseString))
                {
                    return doc.RootElement.GetProperty("access_token").GetString();
                }
            }

            Console.WriteLine($"Error fetching token: {response.StatusCode}");
            return null;
        }
    }

    private List<Transaction> GetTransactionsFromDatabase()
    {
        List<Transaction> transactions = new List<Transaction>();

        using (MySqlConnection conn = new MySqlConnection(_connectionString))
        {
            try
            {
                conn.Open();
                string query = "SELECT * FROM aia.transactions WHERE status = 0";

                using (MySqlCommand cmd = new MySqlCommand(query, conn))
                using (MySqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        transactions.Add(new Transaction
                        {
                            memberIdentifierReference = reader["memberIdentifierReference"]?.ToString() ?? "",
                            memberIdentifierReferenceType = reader["memberIdentifierReferenceType"]?.ToString() ?? "",
                            partnerTransactionRef = reader["partnerTransactionRef"]?.ToString() ?? "",
                            transactionDesc = "Create",
                            transactionDate = Convert.ToDateTime(reader["transactionDate"]).ToString("yyyy-MM-dd"),
                            qualifyingTransaction = true,
                            usage = new Usage
                            {
                                startDate = Convert.ToDateTime(reader["transactionDate"]).ToString("yyyy-MM-dd"),
                                partnerBranch = "CWB",
                                numOfUsage = reader["numOfUsage"]?.ToString() ?? "1"
                            },
                            amounts = new Amounts
                            {
                                currency = "PHP",
                                fullFareAmount = reader["fullFareAmount"]?.ToString() ?? "",
                                qualifyingAmount = reader["qualifyingAmount"]?.ToString() ?? "",
                                discountedAmount = reader["discountedAmount"]?.ToString() ?? "",
                                additionalFees = reader["additionalFees"]?.ToString() ?? "",
                                cancellationFees = reader["cancellationFees"]?.ToString() ?? "",
                                discountAmount = reader["discountAmount"]?.ToString() ?? "",
                                discountPercentage = reader["discountPercentage"]?.ToString() ?? "",
                                amountEffectiveDate = Convert.ToDateTime(reader["amountEffectiveDate"]).ToString("yyyy-MM-dd")
                            },
                            remarks = "Partner-Capture",
                            items = new List<Item>
                            {
                                new Item
                                {
                                    lineReference = reader["lineReference"]?.ToString() ?? "",
                                    lineDescription = reader["lineDescription"]?.ToString() ?? "",
                                    partnerSubCode = "TOBSPRT",
                                    productInfo = new ProductInfo
                                    {
                                        sku = reader["sku"]?.ToString() ?? "",
                                        uniqueProductRef = reader["uniqueProductRef"]?.ToString() ?? "",
                                        productCategory = reader["productCategory"]?.ToString() ?? ""
                                    },
                                    numOfUsage = reader["numOfUsageItem"]?.ToString() ?? "1",
                                    amounts = new Amounts
                                    {
                                        currency = "PHP",
                                        fullFareAmount = reader["fullFareAmount"]?.ToString() ?? "",
                                        qualifyingAmount = reader["qualifyingAmount"]?.ToString() ?? "",
                                        discountedAmount = reader["discountedAmount"]?.ToString() ?? "",
                                        additionalFees = reader["additionalFees"]?.ToString() ?? "",
                                        cancellationFees = reader["cancellationFees"]?.ToString() ?? "",
                                        discountAmount = reader["discountAmount"]?.ToString() ?? "",
                                        discountPercentage = reader["discountPercentage"]?.ToString() ?? "",
                                        amountEffectiveDate = Convert.ToDateTime(reader["amountEffectiveDate"]).ToString("yyyy-MM-dd")
                                    }
                                }
                            }
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Database Error: " + ex.Message);
            }
        }

        return transactions;
    }
}
