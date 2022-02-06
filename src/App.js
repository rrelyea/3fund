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
      </header>
    </div>
  );
}

function renderPage() {
  var status = document.getElementById('status');
  if (monthlyStock != null && monthlyIntlStock != null && monthlyBond != null && dailyStock != null && dailyIntlStock != null && dailyBond != null)
  {
   status.textContent = "Loading price data......completed.";
   console.log(monthlyStock.data, monthlyIntlStock.data, monthlyBond.data, dailyStock.data, dailyIntlStock.data, dailyBond.data);
  }
  else
  {
    status.textContent += ".";
  }
}

export default App;
