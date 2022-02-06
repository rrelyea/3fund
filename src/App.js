import papaparse from 'papaparse';
import './App.css';

var monthlyStock = null;
var monthlyIntlStock = null;
var monthlyBond = null;
var dailyStock = null;
var dailyIntlStock = null;
var dailyBond = null;

function App() {
  papaparse.parse("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/M_VTI.csv", {
    download: true,
    complete: function(data) {
      monthlyStock = data;
      renderPage(monthlyStock, monthlyIntlStock, monthlyBond, dailyStock, dailyIntlStock, dailyBond);
    }
  });

  papaparse.parse("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/M_VXUS.csv", {
    download: true,
    complete: function(data) {
      monthlyIntlStock = data;
      renderPage(monthlyStock, monthlyIntlStock, monthlyBond, dailyStock, dailyIntlStock, dailyBond);
    }
  });

  papaparse.parse("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/M_BND.csv", {
    download: true,
    complete: function(data) {
      monthlyBond = data;
      renderPage(monthlyStock, monthlyIntlStock, monthlyBond, dailyStock, dailyIntlStock, dailyBond);
    }
  });

  papaparse.parse("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_VTI.csv", {
    download: true,
    complete: function(data) {
      dailyStock = data;
      renderPage(dailyStock, dailyIntlStock, dailyBond, dailyStock, dailyIntlStock, dailyBond);
    }
  });

  papaparse.parse("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_VXUS.csv", {
    download: true,
    complete: function(data) {
      dailyIntlStock = data;
      renderPage(dailyStock, dailyIntlStock, dailyBond, dailyStock, dailyIntlStock, dailyBond);
    }
  });

  papaparse.parse("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_BND.csv", {
    download: true,
    complete: function(data) {
      dailyBond = data;
      renderPage(dailyStock, dailyIntlStock, dailyBond, dailyStock, dailyIntlStock, dailyBond);
    }
  });

  return (
    <div className="App">
      <header className="App-header">
        <p id='status'>
          Loading price data
        </p>
        <div id='stock'>

        </div>
        <div id='stockIntl'>

        </div>
        <div id='bond'>

        </div>
      </header>
    </div>
  );
}

var rendered = false;

function renderPage() {

  var status = document.getElementById('status');
  var stock = document.getElementById('stock');
  var stockIntl = document.getElementById('stockIntl');
  var bond = document.getElementById('bond');
  if (monthlyStock != null && monthlyIntlStock != null && monthlyBond != null && dailyStock != null && dailyIntlStock != null && dailyBond != null && rendered === false)
  {
    rendered = true;
    stock.innerText = "VTI";
    stockIntl.innerText = "VXUS";
    bond.innerText = "BND";
    status.textContent = "Daily prices";
    var length = dailyStock.data.length;

    for (var i = 1; i < length - 1; i++) {
        stock.innerText += "  " + dailyStock.data[i][1];
        stockIntl.innerText += "  " + dailyIntlStock.data[i][1];
        bond.innerText += "  " + dailyBond.data[i][1];
    }
  }
}

export default App;
