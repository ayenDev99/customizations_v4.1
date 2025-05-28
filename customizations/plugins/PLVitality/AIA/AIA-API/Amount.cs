using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIA_API
{
    public class Amounts
    {
        public string currency { get; set; }
        public string fullFareAmount { get; set; }
        public string qualifyingAmount { get; set; }
        public string discountedAmount { get; set; }
        public string discountAmount { get; set; }
        public string discountPercentage { get; set; }
        public string amountEffectiveDate { get; set; }
        public string additionalFees { get; set; }
        public string cancellationFees { get; set; }

    }
}
