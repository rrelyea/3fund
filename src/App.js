import papaparse from 'papaparse';
import React from 'react';
import './App.css';

class App extends React.Component {
  state = {
    monthlyQuotes: null,
    dailyQuotes: null,
    indexes: [1,1,1],
    startYear: 0,
    startMonth: 0,
    statusMessage: "Loading price data",
  };

  async toCsv(uri) {
    return new Promise((resolve, reject) => {
      papaparse.parse(uri, {
        download: true,
        complete (results, file) {
          resolve(results.data)
        },
        error (err, file) {
          reject(err)
        }
      })
    })
  }

  async componentDidMount () {
    this.state.monthlyQuotePromises = [
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/M_VTI.csv"),
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/M_VXUS.csv"),
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/M_BND.csv")];
    this.state.dailyQuotePromises = [
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_VTI.csv"),
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_VXUS.csv"),
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_BND.csv")];

    this.state.monthlyQuotes = await Promise.all(this.state.monthlyQuotePromises);
    this.state.dailyQuotes = await Promise.all(this.state.dailyQuotePromises);

    this.state.dailyQuotePromises = null;
    this.state.monthlyQuotePromises = null;

    var loop = true;
    while (loop) {
      if (this.state.monthlyQuotes[0][this.state.indexes[0]].length === 1 
        || this.state.monthlyQuotes[1][this.state.indexes[1]].length === 1 
        || this.state.monthlyQuotes[2][this.state.indexes[2]].length === 1) {
          loop = false;
      } else {
        var s = this.state.monthlyQuotes[0][this.state.indexes[0]][0];
        var sI = this.state.monthlyQuotes[1][this.state.indexes[1]][0];
        var b = this.state.monthlyQuotes[2][this.state.indexes[2]][0];
  
        var max;
        if (s < sI) {
          max = sI;
        } else {
          max = s;
        }
        if (max < b) {
          max = b;
        }
        
        if (s < max) this.state.indexes[0] = this.state.indexes[0] + 1;
        if (sI < max) this.state.indexes[1] = this.state.indexes[1] + 1;
        if (b < max) this.state.indexes[2] = this.state.indexes[2] + 2;
  
        if (s === sI && sI === b) {
          var date = this.state.monthlyQuotes[0][this.state.indexes[0]][0];
          this.state.startYear = parseInt(date.substr(0,4));
          this.state.startMonth = parseInt(date.substr(5,2));
          loop = false;
        }
      }
    }
    this.state.statusMessage = "3fund Price Data";
    this.setState(this.state.monthlyQuotes);
  }

  render () {
    return  (this.state.monthlyQuotes !== null) && 
      <div>
        <header className="App-header">
          <h3 id='status'>
            {this.state.statusMessage}
          </h3>
          <table>
            <tr>
              <td>
                <table>
                  <thead>
                    <tr>
                      <th>Years</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                      <>{showYears(this.state)}</>
                  </tbody>
                </table>
              </td>
              <td>
                <table>
                  <thead>
                    <tr>
                      <th>Months</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                      <>{showMonths(this.state)}</>
                  </tbody>
                </table>
                <div>&nbsp;</div>
                <table>
                  <thead>
                    <tr>
                      <th>Days</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                      <>{showDays(this.state)}</>
                  </tbody>
                </table>
              </td>
            </tr>
          </table>
        </header>
      </div>
    ;
  }
}

function getPrice (data, year, month, fund) {
  var i = (year - data.startYear) * 12 + (month - data.startMonth);
  if (i + data.indexes[fund] < 1) return null;
  if (i + data.indexes[fund] > data.monthlyQuotes[fund].length) return null;
  return data.monthlyQuotes[fund][i + data.indexes[fund]][1];
}

function getChange(data, yearA, monthA, yearB, monthB, fund) {
  if (monthA === 1) {
    monthA = 12;
    yearA = yearA - 1;
  } else {
    monthA = monthA - 1;
  }

  var startPrice = getPrice(data, yearA, monthA, fund);
  if (startPrice === null) return null;
  var endPrice = getPrice(data, yearB, monthB, fund);
  if (endPrice === null) return null;
  var change = (endPrice - startPrice)/startPrice;
  return change;
}


function getDayChange(data, yearA, monthA, dayIndex, fund) {
  if (monthA === 1) {
    monthA = 12;
    yearA = yearA - 1;
  } else {
    monthA = monthA - 1;
  }

  var startPrice = getPrice(data, yearA, monthA, fund);
  if (startPrice === null) return null;
  var previousDayPrice = data.dailyQuotes[fund][dayIndex-1][1];
  if (previousDayPrice === "close") previousDayPrice = startPrice;
  var dayPrice = data.dailyQuotes[fund][dayIndex][1];
  var change = (dayPrice - previousDayPrice)/startPrice;
  return change;
}

function showYears (data) {
  var assetStock = 2/3;
  var assetStockIntl = .2;
  var assetBond = 1/3;
  var currentMonth = new Date().getMonth();
  var currentYear = new Date().getFullYear();

  var years = Array(currentYear - data.startYear);

  for (var year = currentYear; year >= data.startYear; year--) {
    var endMonth = year === currentYear ? currentMonth : 12;
    var delta1 = getChange(data, year, 1, year, endMonth, 0);
    var delta2 = getChange(data, year, 1, year, endMonth, 1);
    var delta3 = getChange(data, year, 1, year, endMonth, 2);
    var composite = (assetStock * 100 * (1-assetStockIntl)) * delta1 + 
      (assetStock * 100 * (assetStockIntl)) * delta2 + 
      (assetBond * 100 * delta3);
    composite = delta1 === null || delta2 === null || delta3 === null ? null : composite;
    years[currentYear-year] = new Array(2);
    years[currentYear-year][0] = year;
    years[currentYear-year][1] = composite;
  }

  return years.map( period => <tr><td>{period[0]}</td><td>{Number(period[1]).toFixed(2)+"%"}</td></tr> );
}

function showMonths (data) {
  var assetStock = 2/3;
  var assetStockIntl = .2;
  var assetBond = 1/3;
  var currentMonth = new Date().getMonth();
  var currentYear = new Date().getFullYear();
  var months = Array(currentMonth);

  for (var month = 1; month <= currentMonth + 1; month++) {
    var delta1 = getChange(data, currentYear, month, currentYear, month, 0);
    var delta2 = getChange(data, currentYear, month, currentYear, month, 1);
    var delta3 = getChange(data, currentYear, month, currentYear, month, 2);
    var composite = (assetStock * 100 * (1-assetStockIntl)) * delta1 + 
      (assetStock * 100 * (assetStockIntl)) * delta2 + 
      (assetBond * 100 * delta3);
    composite = delta1 == null || delta2 == null || delta3 == null ? null : composite;
    months[month] = new Array(2);
    months[month][0] = month+"/"+currentYear;
    months[month][1] = composite;
  }

  return months.map( period => <tr><td>{period[0]}</td><td>{Number(period[1]).toFixed(2)+"%"}</td></tr> );
}

function showDays (data) {
  var assetStock = 2/3;
  var assetStockIntl = .2;
  var assetBond = 1/3;
  var currentMonth = new Date().getMonth();
  var currentYear = new Date().getFullYear();
  var days = Array(currentMonth);

  for (var dayIndex = 1; dayIndex < data.dailyQuotes[0].length - 1; dayIndex++) {
    var delta1 = getDayChange(data, currentYear, currentMonth, dayIndex, 0);
    var delta2 = getDayChange(data, currentYear, currentMonth, dayIndex, 1);
    var delta3 = getDayChange(data, currentYear, currentMonth, dayIndex, 2);
    var composite = (assetStock * 100 * (1-assetStockIntl)) * delta1 + 
      (assetStock * 100 * (assetStockIntl)) * delta2 + 
      (assetBond * 100 * delta3);
    composite = delta1 == null || delta2 == null || delta3 == null ? null : composite;
    days[dayIndex] = new Array(2);
    days[dayIndex][0] = data.dailyQuotes[0][dayIndex][0].substr(5);
    days[dayIndex][1] = composite;
  }

  return days.map( period => <tr><td>{period[0]}</td><td>{Number(period[1]).toFixed(2)+"%"}</td></tr> );
}

export default App;
