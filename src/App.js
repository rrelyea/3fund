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
    }
  });

  papaparse.parse("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/M_VXUS.csv", {
    download: true,
    complete: function(data) {
      monthlyIntlStock = data;
    }
  });

  papaparse.parse("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/M_BND.csv", {
    download: true,
    complete: function(data) {
      monthlyBond = data;
    }
  });

  papaparse.parse("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_VTI.csv", {
    download: true,
    complete: function(data) {
      dailyStock = data;
    }
  });

  papaparse.parse("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_VXUS.csv", {
    download: true,
    complete: function(data) {
      dailyIntlStock = data;
    }
  });

  papaparse.parse("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_BND.csv", {
    download: true,
    complete: function(data) {
      dailyBond = data;
      renderPage();
    }
  });

  return (
    <div className="App">
      <header className="App-header">
        <p id='status'>
          Loading price data
        </p>
        <table>
          <thead>
            <tr>
              <th>Dates</th>
              <th>Stocks</th>
              <th>IntlStocks</th>
              <th>Bonds</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><div id='dates'>
              </div></td>
              <td><div id='stock'>
              </div></td>
              <td><div id='stockIntl'>
              </div></td>
              <td><div id='bond'>
              </div></td>
            </tr>
          </tbody>
        </table>
      </header>
    </div>
  );
}


function renderPage() {
  console.log("renderpage");
  var status = document.getElementById('status');
  var dates = document.getElementById('dates');
  var stock = document.getElementById('stock');
  var stockIntl = document.getElementById('stockIntl');
  var bond = document.getElementById('bond');
  if (monthlyStock != null && monthlyIntlStock != null && monthlyBond != null && dailyStock != null && dailyIntlStock != null && dailyBond != null)
  {
    console.log("dataready");
    dates.innerText = "";
    stock.innerText = "VTI";
    stockIntl.innerText = "VXUS";
    bond.innerText = "BND";
    status.textContent = "Daily prices";

    var iStocks = 1;
    var iStocksIntl = 1;
    var iBonds = 1;
    while (true) {
      if (monthlyStock.data[iStocks].length === 1 
        || monthlyIntlStock.data[iStocksIntl].length === 1 
        || monthlyBond.data[iBonds].length === 1) {
          return;
      }
      else
      {
        var s = monthlyStock.data[iStocks][0];
        var sI = monthlyIntlStock.data[iStocksIntl][0];
        var b = monthlyBond.data[iBonds][0];
        console.log(s, sI, b);

        var max;
        if (s < sI) {
          max = sI;
        } else {
          max = s;
        }
        if (max < b)
        {
          max = b;
        }
        
        if (s < max) iStocks++;
        if (sI < max) iStocksIntl++;
        if (b < max) iBonds++;

        if (s === sI && sI === b)
        {
          console.log(iStocks, iStocksIntl, iBonds);
          dates.innerText += "  " + monthlyStock.data[iStocks][0];
          stock.innerText += "  " + monthlyStock.data[iStocks][1];
          stockIntl.innerText += "  " + monthlyIntlStock.data[iStocksIntl][1];
          bond.innerText += "  " + monthlyBond.data[iBonds][1];
          iStocks++;
          iStocksIntl++;
          iBonds++;
        }
      }
    }
    
    var dailyLength = dailyStock.data.length;
    for (var i = 1; i < dailyLength - 1; i++) {
        dates.innerText += "  " + dailyStock.data[i][0];
        stock.innerText += "  " + dailyStock.data[i][1];
        stockIntl.innerText += "  " + dailyIntlStock.data[i][1];
        bond.innerText += "  " + dailyBond.data[i][1];
    }
  }
}


export default App;
