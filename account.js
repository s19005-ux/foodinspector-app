document.addEventListener("DOMContentLoaded", function() {
    const foodData = JSON.parse(localStorage.getItem("food-data"));
    const tableBody = document.getElementById("table");
    foodData.forEach(food => {
  const row = document.createElement("tr");

  const foodNameCell = document.createElement("td");
  foodNameCell.textContent = food.foodname;
  row.appendChild(foodNameCell);

  const shelfLifeCell = document.createElement("td");
  shelfLifeCell.textContent = food.expirydate;
  row.appendChild(shelfLifeCell);


  const storageCell = document.createElement("td");
  storageCell.textContent = food.storage;
  row.appendChild(storageCell);


  tableBody.appendChild(row);
});

});