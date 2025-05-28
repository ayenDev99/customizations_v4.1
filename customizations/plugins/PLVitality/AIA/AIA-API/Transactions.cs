using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIA_API
{
    public class Transaction
    {
        public string memberIdentifierReference { get; set; }
        public string memberIdentifierReferenceType { get; set; }
        public string partnerTransactionRef { get; set; }
        public string transactionDesc { get; set; }
        public string transactionDate { get; set; }
        public bool qualifyingTransaction { get; set; }
        public Usage usage { get; set; }
        public Amounts amounts { get; set; }
        public string remarks { get; set; }
        public List<Item> items { get; set; }
    }
}
