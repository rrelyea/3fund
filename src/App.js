import papaparse from 'papaparse';
import React from 'react';
import './App.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController,
} from "chart.js";
import { Chart } from 'react-chartjs-2';

class App extends React.Component {
  state = {
    monthlyQuotes: null,
    dailyQuotes: null,
    startYear: 0,
    startMonth: 0,
    statusMessage: "Loading prices",
    editMode: false,
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    showMonth: 0,
    showYear: 0,
  };
  month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
        if (this.state.fundTypes[i][0].toUpperCase() === this.state.type.toUpperCase()) {
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
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/MA_" + this.state.tickers[0] + ".csv"),
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/MA_" + this.state.tickers[1] + ".csv"),
      this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/MA_" + this.state.tickers[2] + ".csv")];
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
      this.state.statusMessage = null;
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
    this.setAllocations(sbAllocations[0], intl, sbAllocations[1], true)
  }

  setAllocations(stockAlloc, intlAlloc, bondAlloc, commit) {
    var sbAllocations = [stockAlloc, bondAlloc];

    var sAllocation = parseInt(sbAllocations[0]) / 100;
    var bAllocation = parseInt(sbAllocations[1]) / 100;
    var iAllocation = intlAlloc !== null ? parseInt(intlAlloc) / 100 : 0;
    this.state.allocations = [sAllocation,iAllocation,bAllocation];

    if (commit) {
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
    }
    this.setState(this.state.allocations);
  }

  getParam(params, paramName, defaultValue) {
    return params.has(paramName) ? params.get(paramName) : defaultValue
  }

  setParam (value, params, paramName, defaultValue) {
    if (value === defaultValue || value === 0) {
      if (params.has(paramName)) params.delete(paramName);
    } else {
      params.set(paramName, value);
    }
  }

  async harvestParams () {
    const params = new URLSearchParams(window.location.search);
    this.state.type = this.getParam(params, 'type', 'VanguardETF');
    this.state.showYear = Number(this.getParam(params, 'year', this.state.showYear));
    var fundTypesPromise = this.toCsv("https://raw.githubusercontent.com/rrelyea/3fund-prices/main/data/fundTypes.csv");
    this.state.fundTypes = await fundTypesPromise;
    this.harvestAllocations();
  }

  setParams() {
    var params = new URLSearchParams(window.location.search);
    this.setParam(this.state.type, params, 'type', 'VanguardETF');
    this.setParam(this.state.showYear, params, 'year', 0);
    if (Array.from(params).length > 0) {
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    } else {
      window.history.replaceState({}, "", `${window.location.pathname}`);
    }
  }

  async componentDidMount () {
    await this.harvestParams();
    this.loadFundInfo();
  }

  chartData =
              {
                datasets: []
              };

   changeYear = (e) => {
    var checkbox = e.target;
    var year = checkbox.getAttribute('year');
    var checked = checkbox.checked;
    this.state.showYear = checked ? Number(year) : 0

    // clear all checkboxes except for latest clickced
    var checkboxes = document.getElementsByName('check')
    checkboxes.forEach((item) => {
        item.checked = Number(item.getAttribute('year')) === this.state.showYear;
    });

    this.setParams();
    this.harvestParams();
    this.render();
  }

  render () {
    const handleChange = (e) => {
      this.state.type = e.target.value;
      this.setParams();
      this.loadFundInfo();
      this.render();
    }

    const handleSlide = (e) => {
      var stockAlloc = document.getElementById('stockAlloc');
      var bondAlloc = document.getElementById('bondAlloc');
      var stock = e.target.value;
      var bond = 100 - stock;
      stockAlloc.innerText = e.target.value + '%';
      bondAlloc.innerText = 100 - e.target.value + '%';
      var i = this.state.allocations[1] * 100;
      this.setAllocations(stock, i, bond, true);
    }

    const handleIntlSlide = (e) => {
      var intlAlloc = document.getElementById('intlAlloc');
      intlAlloc.innerText = e.target.value + '%';
      var s = this.state.allocations[0] * 100;
      var b = this.state.allocations[2] * 100;
      this.setAllocations(s.toString(), e.target.value, b.toString(), false);
    }
    
    const toggleEditMode = (e) => {
      this.state.editMode = !this.state.editMode;

      if (!this.state.editMode) {
        var stockAlloc = document.getElementById('stockAlloc');
        var bondAlloc = document.getElementById('bondAlloc');

        var stock = Number(stockAlloc.innerText.substring(0, stockAlloc.innerText.length - 1));
        var bond = Number(bondAlloc.innerText.substring(0, bondAlloc.innerText.length - 1));
        var i = this.state.allocations[1] * 100;
        this.setAllocations(stock, i, bond, true);
      }

      this.setState(this.state);
      this.render();
    }

    ChartJS.register(LineController, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
    
    var chartOptions = 
          {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
              x: {
                  ticks: {
                      font: {
                          size: 10,
                          },
                  }
              }
            }
          };

    return  (this.state.monthlyQuotes !== null) && 
      <div lang='en'>
        <header className="App-header">
          <div>
            <select id='fundType' value={this.state.type} onChange={(e) => handleChange(e)}>
              {this.state.fundTypes.filter(fundType => fundType[0] !== '' && fundType[0] !== 'type').map((fundType,index) => 
                <option key={index} value={fundType.length > 0 ? fundType[0] : "filler"}>{fundType.length > 0 ? fundType[0] : "filler"}</option>
              )} 
            </select>
            <span id='tickers' lang='en'>
            &nbsp;&nbsp;({this.state.tickers.join(" - ")})
            </span>
          </div>


          <div className='container'>
            <span className='allocation item item-1'>
            Stocks: <span id='stockAlloc'>{this.state.allocations[0]*100}%</span>
            </span>
            <span className='item item-2'>
              {this.state.editMode ? <input type="range" min="0" max="100" defaultValue={this.state.allocations[0]*100} onInput={(e)=>handleSlide(e,false)} onChange={(e)=>handleSlide(e,true)} /> : <span className='slash'>&nbsp;/&nbsp;</span> }
            </span>
            <span className='allocation item item-3'>
              Bonds: <span id='bondAlloc'>{this.state.allocations[2]*100}%</span>
            </span>
            <br/>
            <span className='allocation'>
            International: <span id='intlAlloc'>{this.state.allocations[1]*100}%</span>
            </span>
            <span className='allocation'>
              {this.state.editMode ? <input type="range" min="0" max="100" defaultValue={this.state.allocations[1]*100} onInput={(e)=>handleIntlSlide(e,false)} onChange={(e)=>handleIntlSlide(e,true)} /> : false }
            </span>
            <button className='editButton' onClick={(e)=>{toggleEditMode(e)}}>{this.state.editMode ? "save" : "edit"}</button>
          </div> 
          <div className="container">
            <Chart type='line' id='chart' height='300' data={this.chartData} options={chartOptions} />
          </div>
          {this.state.statusMessage !== null ? <h4 id='status'>{this.state.statusMessage}</h4> : null }
          <table>
            <tbody>
              <tr>
                <td className='column'>
                  <table>
                    <thead>
                      <tr>
                        <th colSpan='2'>
                            <label>
                              <input defaultChecked={0===this.state.showYear} type='checkbox' name='check' year={0} className='yearButton' onClick={(e)=>this.changeYear(e)} />
                              <span className='year'>All Years</span>
                            </label>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                        <>{this.showYears()}</>
                    </tbody>
                  </table>
                </td>
                <td className='column'>
                  <table>
                    <thead>
                      <tr>
                        <th colSpan='2'>{this.state.showYear > 0 ? this.state.showYear : ""}</th>
                      </tr>
                    </thead>
                    <tbody>
                        <>{this.showMonths()}</>
                    </tbody>
                  </table>
                </td>
                <td className='column'>
                  <table>
                    <thead>
                      <tr>
                        <th colSpan='2'>{this.showDaysHeader()}</th>
                      </tr>
                    </thead>
                    <tbody>
                        <>{this.showDays()}</>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
          <div className='smallerCentered'>
            Contact <a href="https://twitter.com/rrelyea">@rrelyea</a> or <a href="mailto:rob@relyeas.net">rob@relyeas.net</a> or <a href='https://buymeacoffee.com/rrelyea'>buy me a coffee</a> | 
            Github repo for <a href="https://github.com/rrelyea/3fund">this site</a> and <a href="https://github.com/rrelyea/3fund-prices">git-scraping</a>
          </div>
        </header>
      </div>
    ;
  }

  getPrice (data, year, month, fund) {
    var i = (year - data.startYear) * 12 + (month - data.startMonth);
    if (i + data.indexes[fund] < 1) return null;
    if (i + data.indexes[fund] > data.monthlyQuotes[fund].length) return null;
    return data.monthlyQuotes[fund][i + data.indexes[fund]][1];
  }

  getChange(data, yearA, monthA, yearB, monthB, fund) {
    if (monthA === 1) {
      monthA = 12;
      yearA = yearA - 1;
    } else {
      monthA = monthA - 1;
    }

    var startPrice = this.getPrice(data, yearA, monthA, fund);
    if (startPrice === null) return null;
    var endPrice = this.getPrice(data, yearB, monthB, fund);
    if (endPrice === null) return null;
    var change = (endPrice - startPrice)/startPrice;
    return change;
  }


  getDayChange(data, yearA, monthA, dayIndex, fund) {
    if (monthA === 1) {
      monthA = 12;
      yearA = yearA - 1;
    } else {
      monthA = monthA - 1;
    }

    var startPrice = this.getPrice(data, yearA, monthA, fund);
    if (startPrice === null) return null;
    var previousDayPrice = data.dailyQuotes[fund][dayIndex-1][1];
    if (previousDayPrice === "close") previousDayPrice = startPrice;
    var dayPrice = data.dailyQuotes[fund][dayIndex][1];
    var change = (dayPrice - previousDayPrice)/startPrice;
    return change;
  }

  showYears () {
    if (this.state.monthlyQuotes[0] === null) return null;
    if (this.state.allocations === undefined) return null;

    var assetStock = this.state.allocations[0];
    var assetStockIntl = this.state.allocations[1];
    var assetBond = this.state.allocations[2];
    var runningTotal = 10000;
    var eoyLabelAndDataAdded = false;

    var years = Array(this.state.currentYear - this.state.startYear);
    var labels = Array(this.state.currentYear - this.state.startYear + 2);
    var data = Array(this.state.currentYear - this.state.startYear + 2);

    for (var year = this.state.startYear; year <= this.state.currentYear; year++) {
      var endMonth = year === this.state.currentYear ? this.state.currentMonth : 12;
      var startMonth = year === this.state.startYear ? this.state.startMonth + 1 : 1;
      var delta1 = this.getChange(this.state, year, startMonth, year, endMonth, 0);
      if (isNaN(delta1)) {
        endMonth = endMonth - 1;
        delta1 = this.getChange(this.state, year, startMonth, year, endMonth, 0);
      }
      var delta2 = this.getChange(this.state, year, startMonth, year, endMonth, 1);
      var delta3 = this.getChange(this.state, year, startMonth, year, endMonth, 2);
      var composite = (assetStock * 100 * (1-assetStockIntl)) * delta1 + 
        (assetStock * 100 * (assetStockIntl)) * delta2 + 
        (assetBond * 100 * delta3);
      composite = delta1 === null || delta2 === null || delta3 === null ? null : composite;
      years[this.state.currentYear - year + 1] = new Array(2);
      years[this.state.currentYear - year + 1][0] = year;
      years[this.state.currentYear - year + 1][1] = composite;

      if (!eoyLabelAndDataAdded) {
        labels[year - this.state.startYear] = this.state.startYear - 1;
        data[year - this.state.startYear] = runningTotal;
        eoyLabelAndDataAdded = true;
      }
      
      labels[year - this.state.startYear + 1] = year;
      runningTotal = runningTotal * (100.0+Number(composite))/100.0;
      data[year - this.state.startYear + 1] = runningTotal;
    }

    if (this.state.showYear === 0) {
      this.chartData.labels = labels;
      this.chartData.datasets = [{
        data:data,
        label: this.state.startYear.toString() + " - " + this.state.currentYear.toString(),
        borderColor: '#3e95cd',
        backgroundColor: '#7bb6dd',
        fill: false,
      }];
    }

    return years.map( (period, index) => <tr key={index}>
        <td>
          <label>
          <input name='check' defaultChecked={period[0]===this.state.showYear} year={period[0]} type='checkbox' className='yearButton' onClick={(e)=>this.changeYear(e)} />
            <span className='year'>{period[0]}</span>
          </label>
        </td>
        <td className='value'>{Number(period[1]).toFixed(1)+"%"}</td>
      </tr> );
  }

  showMonths () {
    if (this.state.showYear === 0) return null;
    if (this.state.monthlyQuotes[0] === null) return null;
    if (this.state.allocations === undefined) return null;

    var assetStock = this.state.allocations[0];
    var assetStockIntl = this.state.allocations[1];
    var assetBond = this.state.allocations[2];
    var showMonth = this.state.showYear === this.state.currentYear ? this.state.currentMonth : 12;
    var months = Array(showMonth);
    var labels = Array(showMonth + 1);
    var data = Array(showMonth + 1);
    var runningTotal = 10000;
    var eoyLabelAndDataAdded = false;
    for (var month = 1; month <= showMonth; month++) {
      var delta1 = this.getChange(this.state, this.state.showYear, month, this.state.showYear, month, 0);
      var delta2 = this.getChange(this.state, this.state.showYear, month, this.state.showYear, month, 1);
      var delta3 = this.getChange(this.state, this.state.showYear, month, this.state.showYear, month, 2);
      if (delta1 !== null && delta2 !== null && delta3 !== null) {
        var composite = (assetStock * 100 * (1-assetStockIntl)) * delta1 + 
          (assetStock * 100 * (assetStockIntl)) * delta2 + 
          (assetBond * 100 * delta3);
        composite = delta1 == null || delta2 == null || delta3 == null ? null : composite;
        months[showMonth - month] = new Array(2);
        months[showMonth - month][0] = this.month_names_short[month-1];
        months[showMonth - month][1] = isNaN(composite) ? "---" : Number(composite).toFixed(1)+"%";
        if (!eoyLabelAndDataAdded) {
          labels[month-1] = "EOY";
          data[month-1] = runningTotal;
          eoyLabelAndDataAdded = true;
        }
        
        labels[month] = this.month_names_short[month-1];
        runningTotal = runningTotal * (100.0+Number(composite))/100.0;
        data[month] = runningTotal;
      }
    }

    this.chartData.labels = labels;
    this.chartData.datasets = [{
      data:data,
      label: this.state.showYear,
      borderColor: '#3e95cd',
      backgroundColor: '#7bb6dd',
      fill: false,
    }];

    return months.map( (period, index) => period[1] === "---" ? false : <tr key={index}><td>{period[0]}</td><td className='value'>{period[1]}</td></tr> );
  }

  days = Array(this.state.currentMonth);
  showDaysHeader () {
    this.calculateDays();
    if (this.state.currentYear === this.state.showYear) {
      var month = this.state.currentMonth - 1;
      if (this.days[0][0] > new Date().getDay()) {
        month = month - 1;
      }
      
      return this.month_names_short[month] + " " + this.state.currentYear;
    }
    else
      return false;
  }

  calculateDays () {  
    if (this.state.showYear !== this.state.currentYear ||
      this.state.monthlyQuotes[0] === null ||
      this.state.allocations === undefined) {
        return;
    }

    this.days = Array(this.state.currentMonth);
    var assetStock = this.state.allocations[0];
    var assetStockIntl = this.state.allocations[1];
    var assetBond = this.state.allocations[2];
    var dayCount = this.state.dailyQuotes[0].length - 2;

    for (var dayIndex = dayCount; dayIndex >= 1 ; dayIndex--) {
      var delta1 = this.getDayChange(this.state, this.state.currentYear, this.state.currentMonth, dayIndex, 0);
      var delta2 = this.getDayChange(this.state, this.state.currentYear, this.state.currentMonth, dayIndex, 1);
      var delta3 = this.getDayChange(this.state, this.state.currentYear, this.state.currentMonth, dayIndex, 2);
      var composite = (assetStock * 100 * (1-assetStockIntl)) * delta1 + 
        (assetStock * 100 * (assetStockIntl)) * delta2 + 
        (assetBond * 100 * delta3);
      composite = delta1 == null || delta2 == null || delta3 == null ? null : composite;
      this.days[dayCount - dayIndex] = new Array(2);
      this.days[dayCount - dayIndex][0] = this.state.dailyQuotes[0][dayIndex][0].substr(8);
      this.days[dayCount - dayIndex][1] = composite;
    }
  }

  showDays () {
    if (this.state.showYear !== this.state.currentYear ||
      this.state.monthlyQuotes[0] === null ||
      this.state.allocations === undefined) {
        return <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>;
    }

    return this.days.map( (period, index) => <tr key={index}><td>{period[0]}</td><td className='value'>{Number(period[1]).toFixed(1)+"%"}</td></tr> );
  }
}

export default App;
