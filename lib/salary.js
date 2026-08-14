function calculateSalary(data) {
  const stampPrice = Number(data.settings.stampPrice || 0);

  const totalGold = data.sales.reduce(
    (sum, sale) => sum + Number(sale.gold || 0),
    0
  );

  const totalStamp = data.sales.reduce(
    (sum, sale) => sum + Number(sale.stamp || 0),
    0
  );

  // Potongan stamp
  const stampValue = totalStamp * stampPrice;

  // Tax seller:
  // Setiap total gold mencapai 1000g dikenakan 15g
  const sellerTax = Math.floor(totalGold / 1000) * 15;

  // Clean Salary:
  // Total Gold - Stamp Price - Seller Tax
  const totalPool = Math.max(
    0,
    totalGold - stampValue - sellerTax
  );

  const memberCount = data.settings.salaryMembers.length;

  // Salary per person dibulatkan ke bawah
  const salaryPerMember =
    memberCount > 0 ?
    Math.floor(totalPool / memberCount) :
    0;

  return {
    stampPrice,
    totalGold,
    totalStamp,
    stampValue,
    totalPool,
    memberCount,
    salaryPerMember
  };
}

module.exports = {
  calculateSalary
};