import papaparse from 'papaparse';
import React from 'react';
import './App.css';

class App extends React.Component {
  state = {
    monthlyQuotes: null,
    dailyQuotes: null,
    startYear: 0,
    startMonth: 0,
    statusMessage: "Loading prices",
  };

  async toCsv(uri) {
    return new Promise((resolve, reject) => {
      papaparse.parse(uri, {
        download: true,
        complete (results, file) {
          resolve(results.data)
        },
        error (error, file) {
          resolve(null)
        }
      })
    })
  }

  setTickers ()
  {
    this.state.tickers = null;
    var eof = false;
    var i = 1;
    while (!eof) {
      if (this.state.fundTypes[i][0] !== '') {
        if (this.state.fundTypes[i][0].toUpperCase() == this.state.type.toUpperCase()) {
          this.state.tickers = [this.state.fundTypes[i][1], this.state.fundTypes[i][2], this.state.fundTypes[i][3]];
        }

        i++;
      } else {
        eof = true;
      }
    }
  }

  async loadFundInfo() {
    this.state.monthlyQuotes = [null, null, null];
    this.state.dailyQuotes = [null, null, null];

    this.setTickers();

    if (this.state.tickers === null) return null;

    var monthlyQuotePromises = [
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/M_" + this.state.tickers[0] + ".csv"),
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/M_" + this.state.tickers[1] + ".csv"),
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/M_" + this.state.tickers[2] + ".csv")];
    var dailyQuotePromises = [
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_" + this.state.tickers[0] + ".csv"),
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_" + this.state.tickers[1] + ".csv"),
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/D_" + this.state.tickers[2] + ".csv")];

    this.state.monthlyQuotes = await Promise.all(monthlyQuotePromises);
    this.state.dailyQuotes = await Promise.all(dailyQuotePromises);

    this.state.indexes = [1,1,1];
    if (this.state.monthlyQuotes[0] !== null) {
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
      this.state.statusMessage = "Composite Returns";
    } else {
      this.state.statusMessage = "No data found";
    }

    this.setState(this.state);
  }

  harvestAllocations() {
    const params = new URLSearchParams(window.location.search);
    var aa = params.has('aa') ? params.get('aa') : '70-30';
    var intl = params.has('intl') ? params.get('intl') : '20';
    var sbAllocations = aa.split('-');
    this.setAllocations(sbAllocations[0], intl, sbAllocations[1])
  }

  setAllocations(stockAlloc, intlAlloc, bondAlloc) {
    var sbAllocations = [stockAlloc, bondAlloc];

    var sAllocation = parseInt(sbAllocations[0]) / 100;
    var bAllocation = parseInt(sbAllocations[1]) / 100;
    var iAllocation = intlAlloc !== null ? parseInt(intlAlloc) / 100 : 0;
    this.state.allocations = [sAllocation,iAllocation,bAllocation];

    const params = new URLSearchParams(window.location.search);

    if (this.state.type !== "VanguardETF") {
      params.set('type', this.state.type);
    } else {
      if (params.has('type')) params.delete('type');
    }

    if (sAllocation !== .7) {
      params.set('aa', sAllocation*100 + "-" + bAllocation*100);
    } else {
      if (params.has('aa')) params.delete('aa');
    }

    if (iAllocation !== .2) {
      params.set('intl', iAllocation*100);
    } else {
      if (params.has('intl')) params.delete('intl');
    }

    if (Array.from(params).length > 0) {
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    } else {
      window.history.replaceState({}, "", `${window.location.pathname}`);
    }
    this.setState(this.state.allocations);
  }

  async componentDidMount () {
    const params = new URLSearchParams(window.location.search);

    this.state.type = params.has('type') ? params.get('type') : 'VanguardETF';
    var fundTypesPromise = this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/fundTypes.csv");
    this.state.fundTypes = await fundTypesPromise;
    this.harvestAllocations();
    this.loadFundInfo();
  }

  render () {
    const handleChange = (e) => {
      this.state.type = e.target.value;

      var params = new URLSearchParams(window.location.search);
      if (this.state.type === "VanguardETF") {
        if (params.has('type')) params.delete('type');
      } else {
        params.set('type', this.state.type);
      }

      if (Array.from(params).length > 0) {
        window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
      } else {
        window.history.replaceState({}, "", `${window.location.pathname}`);
      }
      
      this.loadFundInfo();
      this.render();
    }

    const handleSlide = (e) => {
      var stockAlloc = document.getElementById('stockAlloc');
      var bondAlloc = document.getElementById('bondAlloc');
      stockAlloc.innerText = e.target.value + '%';
      bondAlloc.innerText = 100 - e.target.value + '%';
      var i = this.state.allocations[1] * 100;
      this.setAllocations(e.target.value, i, 100 - e.target.value);
    }

    const handleIntlSlide = (e) => {
      var intlAlloc = document.getElementById('intlAlloc');
      intlAlloc.innerText = e.target.value + '%';
      var s = this.state.allocations[0] * 100;
      var b = this.state.allocations[2] * 100;
      this.setAllocations(s.toString(), e.target.value, b.toString());
    }
    
    return  (this.state.monthlyQuotes !== null) && 
      <div lang='en'>
        <header className="App-header">
          <div>

            <label htmlFor='fundType'>Funds:&nbsp;</label>
            <select id='fundType' value={this.state.type} onChange={(e) => handleChange(e)}>
              {this.state.fundTypes.filter(fundType => fundType[0] !== '' && fundType[0] !== 'type').map((fundType,index) => 
                <option key={index} value={fundType.length > 0 ? fundType[0] : "filler"}>{fundType.length > 0 ? fundType[0] : "filler"}</option>
              )} 
            </select>
          </div>

          <div id='tickers' lang='en'>
            &nbsp;&nbsp;({this.state.tickers.join(" - ")})
          </div>

          <table>
            <tbody>
              <tr>
                <td className='allocation'>
                Stocks<br/><span id='stockAlloc'>{this.state.allocations[0]*100}%</span>
                </td>
                <td>
                  <input type="range" min="0" max="100" defaultValue={this.state.allocations[0]*100} onInput={(e)=>handleSlide(e)} />
                </td>
                <td className='allocation'>
                  Bonds<br/><span id='bondAlloc'>{this.state.allocations[2]*100}%</span>
                </td>
                </tr>
            </tbody>
          </table>
          <table>
            <tbody>
              <tr>
                <td className='allocation'>
                International<br/><span id='intlAlloc'>{this.state.allocations[1]*100}%</span>
                </td>
                <td className='allocation'>
                  <input type="range" min="0" max="100" defaultValue={this.state.allocations[1]*100} onInput={(e)=>handleIntlSlide(e)} />
                </td>
              </tr>
            </tbody>
          </table>
          <h4 id='status'>
            {this.state.statusMessage}
          </h4>
          <table>
            <tbody>
              <tr>
                <td className='column'>
                  <table>
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                        <>{showYears(this.state)}</>
                    </tbody>
                  </table>
                </td>
                <td className='column'>
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                        <>{showMonths(this.state)}</>
                    </tbody>
                  </table>
                </td>
                <td className='column'>
                  <table>
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                        <>{showDays(this.state)}</>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
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
  if (data.monthlyQuotes[0] === null) return null;
  if (data.allocations === undefined) return null;

  var assetStock = data.allocations[0];
  var assetStockIntl = data.allocations[1];
  var assetBond = data.allocations[2];
  var currentMonth = new Date().getMonth() + 1;
  var currentYear = new Date().getFullYear();

  var years = Array(currentYear - data.startYear);

  for (var year = currentYear; year >= data.startYear; year--) {
    var endMonth = year === currentYear ? currentMonth : 12;
    var startMonth = year === data.startYear ? data.startMonth + 1 : 1;
    var delta1 = getChange(data, year, startMonth, year, endMonth, 0);
    var delta2 = getChange(data, year, startMonth, year, endMonth, 1);
    var delta3 = getChange(data, year, startMonth, year, endMonth, 2);
    var composite = (assetStock * 100 * (1-assetStockIntl)) * delta1 + 
      (assetStock * 100 * (assetStockIntl)) * delta2 + 
      (assetBond * 100 * delta3);
    composite = delta1 === null || delta2 === null || delta3 === null ? null : composite;
    years[currentYear-year] = new Array(2);
    years[currentYear-year][0] = year.toString().substr(2);
    years[currentYear-year][1] = composite;
  }

  return years.map( (period, index) => <tr key={index}><td>{period[0]}</td><td className='value'>{Number(period[1]).toFixed(1)+"%"}</td></tr> );
}

var month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function showMonths (data) {
  if (data.monthlyQuotes[0] === null) return null;
  if (data.allocations === undefined) return null;

  var assetStock = data.allocations[0];
  var assetStockIntl = data.allocations[1];
  var assetBond = data.allocations[2];
  var currentMonth = new Date().getMonth() + 1;
  var currentYear = new Date().getFullYear();
  var months = Array(currentMonth);
  
  for (var month = currentMonth; month > 0; month--) {
    var delta1 = getChange(data, currentYear, month, currentYear, month, 0);
    var delta2 = getChange(data, currentYear, month, currentYear, month, 1);
    var delta3 = getChange(data, currentYear, month, currentYear, month, 2);
    var composite = (assetStock * 100 * (1-assetStockIntl)) * delta1 + 
      (assetStock * 100 * (assetStockIntl)) * delta2 + 
      (assetBond * 100 * delta3);
    composite = delta1 == null || delta2 == null || delta3 == null ? null : composite;
    months[currentMonth - month] = new Array(2);
    months[currentMonth - month][0] = month_names_short[month-1];
    months[currentMonth - month][1] = composite;
  }

  return months.map( (period, index) => <tr key={index}><td>{period[0]}</td><td className='value'>{Number(period[1]).toFixed(1)+"%"}</td></tr> );
}

function showDays (data) {
  if (data.monthlyQuotes[0] === null) return null;
  if (data.allocations === undefined) return null;

  var assetStock = data.allocations[0];
  var assetStockIntl = data.allocations[1];
  var assetBond = data.allocations[2];
  var currentMonth = new Date().getMonth() + 1;
  var currentYear = new Date().getFullYear();
  var days = Array(currentMonth);
  var dayCount = data.dailyQuotes[0].length - 2;

  for (var dayIndex = dayCount; dayIndex >= 1 ; dayIndex--) {
    var delta1 = getDayChange(data, currentYear, currentMonth, dayIndex, 0);
    var delta2 = getDayChange(data, currentYear, currentMonth, dayIndex, 1);
    var delta3 = getDayChange(data, currentYear, currentMonth, dayIndex, 2);
    var composite = (assetStock * 100 * (1-assetStockIntl)) * delta1 + 
      (assetStock * 100 * (assetStockIntl)) * delta2 + 
      (assetBond * 100 * delta3);
    composite = delta1 == null || delta2 == null || delta3 == null ? null : composite;
    days[dayCount - dayIndex] = new Array(2);
    days[dayCount - dayIndex][0] = data.dailyQuotes[0][dayIndex][0].substr(8);
    days[dayCount - dayIndex][1] = composite;
  }

  return days.map( (period, index) => <tr key={index}><td>{period[0]}</td><td className='value'>{Number(period[1]).toFixed(1)+"%"}</td></tr> );
}

export default App;
