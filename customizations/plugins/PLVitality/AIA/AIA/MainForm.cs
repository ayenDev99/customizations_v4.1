using MySql.Data.MySqlClient;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Drawing;
using System.Net;
using System.ServiceProcess;
using System.Windows.Forms;
using AIA_API;

namespace AIA
{
    public partial class MainForm : Form
    {
        private System.Windows.Forms.Timer refreshTimer;
        private bool hasShownOfflineMessage = false;
        private string connectionString = "server=localhost;database=AIA;user=root;password=sysadmin;port=3306;";
        public MainForm()
        {
            InitializeComponent();



            LoadtotalUnsentNumCount();
            LoadtotalSentNumCount();
            LoadtotalTransactionNumCount();
            LoadDataGrid();
            ConfigureDataGridView();

            refreshTimer = new System.Windows.Forms.Timer();
            refreshTimer.Interval = 5000;
            refreshTimer.Tick += RefreshTimer_Tick;
            refreshTimer.Start();
        }

        private bool IsInternetAvailable()
        {
            try
            {
                using (var client = new WebClient())
                using (client.OpenRead("http://www.google.com"))
                {
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }
        private void RefreshTimer_Tick(object sender, EventArgs e)
        {
            if (!IsInternetAvailable())
            {
                netStatus.Text = "No internet connection. Offline Mode is activated";
                netStatus.Visible = true;
                netStatus.ForeColor = Color.Red;
                //MessageBox.Show("No internet connection. Unable to load transaction data.", "Offline Mode", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            else
            {
                netStatus.Visible = false;
            }
            LoadtotalUnsentNumCount();
            LoadtotalSentNumCount();
            LoadtotalTransactionNumCount();
            LoadDataGrid();
        }
        private void ConfigureDataGridView()
        {
            tableData.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill; 
            tableData.AutoSizeRowsMode = DataGridViewAutoSizeRowsMode.AllCells; 
            tableData.DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            tableData.ColumnHeadersDefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            tableData.AllowUserToAddRows = false;
            tableData.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
        }
        private void startService_Click(object sender, EventArgs e)
        {
            string exePath = @"C:\Users\JOHN.TEODORO\OneDrive - Genie Technologies Inc\Desktop\AIA\AIA\bin\Release\AIA-API.exe";

            try
            {
                Process.Start(exePath);
                MessageBox.Show("AIA-API.exe started successfully!");
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error starting AIA-API.exe: " + ex.Message);
            }
        }
        private void LoadtotalUnsentNumCount()
        {
            try
            {
                using (MySqlConnection conn = new MySqlConnection(connectionString))
                {
                    conn.Open();
                    string query = "SELECT COUNT(*) FROM transactions WHERE status = 0";
                    using (MySqlCommand cmd = new MySqlCommand(query, conn))
                    {
                        int count = Convert.ToInt32(cmd.ExecuteScalar());
                        totalUnsentNum.Text = $"{count}";
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error: {ex.Message}", "Database Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        private void LoadtotalSentNumCount()
        {
            try
            {
                using (MySqlConnection conn = new MySqlConnection(connectionString))
                {
                    conn.Open();
                    string query = "SELECT COUNT(*) FROM transactions WHERE DATE(transactionDate) = CURDATE() AND status = 1";
                    using (MySqlCommand cmd = new MySqlCommand(query, conn))
                    {
                        int count = Convert.ToInt32(cmd.ExecuteScalar());
                        totalSentNum.Text = $"{count}";
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error: {ex.Message}", "Database Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        private void LoadtotalTransactionNumCount()
        {
            try
            {
                using (MySqlConnection conn = new MySqlConnection(connectionString))
                {
                    conn.Open();
                    string query = "SELECT COUNT(*) FROM transactions WHERE DATE(transactionDate) = CURDATE() ORDER BY transactionDate DESC";
                    using (MySqlCommand cmd = new MySqlCommand(query, conn))
                    {
                        int count = Convert.ToInt32(cmd.ExecuteScalar());
                        totalTransactionNum.Text = $"{count}";
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error: {ex.Message}", "Database Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        private void LoadDataGrid()
        {
            try
            {
                using (MySqlConnection conn = new MySqlConnection(connectionString))
                {
                    conn.Open();
                    string query = @"SELECT transactionDate, lineReference, type, memberIdentifierReference, memberfullName, fullFareAmount, status FROM transactions
                                    WHERE DATE(transactionDate) = CURDATE() ORDER BY transactionDate DESC";
                    using (MySqlCommand cmd = new MySqlCommand(query, conn))
                    {
                        using (MySqlDataAdapter adapter = new MySqlDataAdapter(cmd))
                        {
                            DataTable dt = new DataTable();
                            adapter.Fill(dt);

                            dt.Columns["transactionDate"].ColumnName = "SALES DATE AND TIME";
                            dt.Columns["lineReference"].ColumnName = "SI#";
                            dt.Columns["type"].ColumnName = "TYPE";
                            dt.Columns["memberIdentifierReference"].ColumnName = "MEMBER IDENTIFIER";
                            dt.Columns["memberfullName"].ColumnName = "FULL NAME";
                            dt.Columns["fullFareAmount"].ColumnName = "AMOUNT";
                            dt.Columns["status"].ColumnName = "STATUS";

                            tableData.DataSource = dt;
                            CenterGridText();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error: {ex.Message}", "Database Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        private void CenterGridText()
        {
            tableData.DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
            tableData.ColumnHeadersDefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
        }
    }
}
