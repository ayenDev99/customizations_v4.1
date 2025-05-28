using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIA_API
{
    public class Item
    {
        public string lineReference { get; set; }
        public string lineDescription { get; set; }
        public string partnerSubCode { get; set; }
        public ProductInfo productInfo { get; set; }
        public string numOfUsage { get; set; }
        public Amounts amounts { get; set; }
    }
}
