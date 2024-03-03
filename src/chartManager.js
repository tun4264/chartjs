import { deepGet, PapaPromise } from "./utils";
import {
  Chart, 
  BarController,
  BarElement, 
  LineController,
  LineElement,
  PointElement,
  Decimation,
  Filler,
  Legend,
  SubTitle,
  Title,
  Tooltip,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  TimeScale,
  TimeSeriesScale,
  RadialLinearScale,
} from 'chart.js';

Chart.register.apply(null, [
  BarController,
  BarElement, 
  LineController,
  LineElement,
  PointElement,
  Decimation,
  Filler,
  Legend,
  SubTitle,
  Title,
  Tooltip,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  TimeScale,
  TimeSeriesScale,
  RadialLinearScale,
]);


export default class ChartManager {
  /**@type {Papa.ParseResult} */
  #metaPapaResult;
  /**@type {Object.<string, string>[][]} */
  #meta;
  /**@type {Papa.ParseResult} */
  #columnLevelPapaResult;
  /**@type {Object.<string, string>[][]} */
  #columnLevel;
  constructor(ctx, config = {}) {
    this.chart = new Chart(ctx, {
      type: 'line',
      options: {
        animation: false,
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
    /**@type {Object.<string, string[]>} */
    this.filters = {};
    /**@type {Object.<string, string[]>} */
    this.fileFilters = {};
    /**@type {Object.<string, string>[][]} */
    this.data = [];
    /**@type {string[]} */
    this.showColumnNames = [];
    // 表示項目の設定(項目をキーにグループ化する)
    this.displayColumnNames = ['cat2'];
    // 横軸にする項目(粒度が分かれば複数選択可?)
    this.horizontalColumnName = 'type';
    // 縦軸にする項目(複数選択できる？)
    this.verticalColumnName = 'value';
  }
  /**
   * メタデータの取得
   * 必須:ファイルの分割基準項目
   * 任意:ファイルの分割基準項目よりも大きい粒度を持つ項目
   * 必須:ファイルのアドレス
   * @param {string} url 
   * @returns 
   */
  async fetchMetaData(url) {
    const _this = this;
    const metaURL = url;
    /**@type {Papa.ParseResult} */
    this.#metaPapaResult = await PapaPromise(metaURL, {download: true, header: true});
    const errRows = this.#metaPapaResult.errors.map((err) => err.row);
    this.#meta = this.#metaPapaResult.data.filter((_, i) => !errRows.includes(i));
  }
  /**
   * ファイルの分割基準項目の取得
   * @param {string} url 
   */
  async fetchColumnLevel(url) {
    const _this = this;
    const columnLevelRows = [
      {columnName: 'date', level: '1'},
      {columnName: 'cat1', level: '2'},
      {columnName: 'cat2', level: '3'},
      {columnName: 'type', level: '4'},
      {columnName: 'value', level: '4'},
      {columnName: 'high', level: '4'},
      {columnName: 'low', level: '4'},
    ];
    _this.#columnLevel = {};
    for(let i = 0; i < columnLevelRows.length; i++) {
      const row = columnLevelRows[i];
      const name = row['columnName'];
      const level = row['level'];
      _this.#columnLevel[name] = parseFloat(level);
    }
  }
  /**
   * ファイルセレクタを設置する
   * @param {HTMLElement} containerElement 
   */
  async initFileSelector(containerElement) {
    const _this = this;
    if(this.meta.length == 0) throw('metaデータが存在しません');
    if(this.columnLevel.length == 0) throw('columnLevelデータが存在しません');
    _this.metaHeader.sort((a, b) => {
      const al = _this.columnLevel[a] || 999;
      const bl = _this.columnLevel[b] || 999;
      return al - bl;
    });
    _this.metaHeader.forEach((mh, mhi) => {
      if(mh == '{url}') return;
      // 🧪 要検証 粒度の大きい項目から順番にループする？その想定で記述
      /**@type {HTMLSelectElement} */
      const newFileSelecter = document.createElement('select');
      newFileSelecter.multiple = true;
      newFileSelecter.classList.add('chart-file');
      newFileSelecter.classList.add('select-title');
      newFileSelecter.style.setProperty('--select-title-content', `"${mh}"`);
      newFileSelecter.setAttribute('name', mh);
      newFileSelecter.dataset.level = `${mhi}`;
      const values = _this.meta.map((m) => m[mh]);
      values.sort();
      let first = true;
      new Set(values).forEach((m) => {
        const value = m;
        const newOption = document.createElement('option');
        newOption.setAttribute('name', value);
        newOption.value = value;
        newOption.setAttribute('name', value);
        newOption.innerHTML = `<span>${value}</span>`;
        newOption.selected = first;
        newFileSelecter.insertAdjacentElement('beforeend', newOption);
        first = false;
      });
      newFileSelecter.addEventListener('change', async (e) => {
        /**@type {HTMLElement} */
        const target = e.target;
        const name = target.getAttribute('name');
        //_this.updateFileSelectFilter();
        _this.fileOptionFilter();
        // 更新された要素がファイルと紐づいている場合のみデータを取得
        const metaMaxLevel = Math.max.apply(null, _this.metaHeader.map((mh) => mh == '{url}' ? -1 : _this.columnLevel[mh]));
        if(_this.columnLevel[name] == metaMaxLevel) {
          console.log('データ更新');
          await _this.loadData();
          _this.initFilter();
        }
        //_this.fileSelectOptionUpdate(target.name);
      }, false);
      containerElement.insertAdjacentElement('beforeend', newFileSelecter);
    });
    //_this.updateFileSelectFilter();
    _this.fileOptionFilter();
    await _this.loadData();
    _this.initFilter();
  }
  /**
   * ファイルフィルタのアップデート
   */
  updateFileSelectFilter() {
    const _this = this;
    /**@type {HTMLSelectElement[]} */
    const fileSelecters = Array.from(document.querySelectorAll('.chart-file'));
    if(fileSelecters.length == 0) return;
    fileSelecters.forEach((fs) => {
      const name = fs.getAttribute('name');
      if(name == '') return;
      const values = Array.from(fs.options).filter((opt) => opt.selected).map((opt) => opt.value);
      //if(values.length == 0) return;
      _this.fileFilters[name] = values;
    });
  }
  /**
   * フィルタの初期化
   * @param {HTMLElement} containerElement 
   */
  initFilter() {
    const containerElement = document.querySelector('#chart-filter');
    const _this = this;
    const columnNames = Object.keys(_this.columnLevel);
    containerElement.innerHTML = ``;
    columnNames.forEach((cn) => {
      if(!_this.showColumnNames.includes(cn)) return;
      console.log(cn);
      const newSelect = document.createElement('select');
      newSelect.multiple = true;
      newSelect.classList.add('chart-filter');
      newSelect.classList.add('select-title');
      newSelect.style.setProperty('--select-title-content', `"${cn}"`);
      newSelect.setAttribute('name', cn);
      const values = _this.data.map((d) => d[cn]);
      values.sort();
      new Set(values).forEach((v) => {
        const value = v;
        const newOption = document.createElement('option');
        newOption.setAttribute('name', value);
        newOption.value = value;
        newOption.innerHTML = `<span>${value}</span>`;
        newSelect.insertAdjacentElement('beforeend', newOption);
      });
      newSelect.addEventListener('change', (e) => {
        _this.updateFilter();
      }, false);
      containerElement.insertAdjacentElement('beforeend', newSelect);
    });
  }
  /**
   * フィルタのアップデート
   */
  updateFilter() {
    const _this = this;
    /**@type {HTMLSelectElement[]} */
    const filterSelecters = Array.from(document.querySelectorAll('.chart-filter'));
    if(filterSelecters.length == 0) return;
    _this.filters = {};
    filterSelecters.forEach((fs) => {
      const name = fs.getAttribute('name');
      if(name == '') return;
      const values = Array.from(fs.options).filter((opt) => opt.selected).map((opt) => opt.value);
      if(values.length == 0) return;
      _this.filters[name] = values;
    });
  }
  /**
   * 指定ファイルの取得
   */
  async loadData() {
    const _this = this;
    const loadURLs = new Set();
    _this.meta.filter((meta) => {
      return Object.keys(_this.fileFilters).every((ff) => _this.fileFilters[ff].includes(meta[ff]));
    }).forEach((meta) => {
      loadURLs.add(meta['{url}']);
    });
    const loadPromises = Array.from(loadURLs.values()).map((url) => PapaPromise(url, {download: true, header: true}));
    const loadResults = await Promise.all(loadPromises);
    const loadData = loadResults.map((lr) => {
      const err = lr.errors.map((err) => err.row);
      return lr.data.filter((_, i) => !err.includes(i));
    });
    _this.data = [].concat.apply([], loadData);
  }
  /**
   * チャートの更新
   */
  updateChart() {
    const _this = this;
    const filterData = _this.data.filter((data) => {
      return Object.keys(_this.filters).every((fn) => _this.filters[fn].includes(data[fn]));
    });
    const groupData = group(filterData, _this.displayColumnNames);
    // 🚧 グループ化したときの集計処理
    _this.chart.data.datasets = [];
    Object.keys(groupData).forEach((key) => {
      /**@type {DataFrame[]} */
      const rows = groupData[key];
      const data = rows.map((row) => {
        return {
          x: row[_this.horizontalColumnName],
          y: row[_this.verticalColumnName],
        };
      });
      _this.chart.data.datasets.push({
        label: `${key}`,
        data: data,
        backgroundColor: 'rgb(96,96,96)',
        borderColor: 'rgb(96,96,96)',
      });
      // 🚧 集計の追加など
    });
    _this.chart.update('show');
  }
  /**
   * ファイルセレクタのオプションのフィルタ
   */
  fileOptionFilter() {
    const _this = this;
    /**@type {HTMLSelectElement[]} */
    const fileSelecters = Array.from(document.querySelectorAll('.chart-file'));
    if(fileSelecters.length == 0) return;
    // 粒度で並び替える
    fileSelecters.sort((a, b) => {
      const al = _this.columnLevel[a.getAttribute('name')] || 999;
      const bl = _this.columnLevel[b.getAttribute('name')] || 999;
      return al - bl;
    });
    _this.fileFilters = {};
    fileSelecters.forEach((fs, fsi) => {
      const name = fs.getAttribute('name');
      if(name == '') return;
      // 始めのセレクト要素(一番粒度の大きい)は何もしない
      if(fsi > 0) {
        // 絞られたテーブルからオプションを絞る
        const tempMeta = _this.meta.filter((meta) => Object.keys(_this.fileFilters).every((ff) => _this.fileFilters[ff].includes(meta[ff])));
        Array.from(fs.options).forEach((opt) => {
          const show = tempMeta.some((tm) => tm[name] == opt.value);
          opt.hidden = !show;
        });
      }
      // 選択されたオプションを取得する
      const values = Array.from(fs.options).filter((opt) => opt.selected).map((opt) => opt.value);
      if(values.length == 0) return;
      _this.fileFilters[name] = values;
    });
  }
  get metaHeader() {
    return this.#metaPapaResult.meta.fields;
  }
  get meta() {
    return this.#meta;
  }
  get columnLevel() {
    return this.#columnLevel;
  }
}

/**
 * 
 * @param {DataFrame} data 
 * @param {string[]} colNames
 * @returns {Object.<string, DataFrame>}
 */
function group(data, colNames) {
  /**@type {Object.<string, DataFrame>} */
  const result = {};
  for(let i = 0; i < data.length; i++) {
    const keys = Object.keys(result);
    const key = colNames.map((cn) => data[i][cn]).join(',');
    //console.log(data[i]);
    if(keys.includes(key)) {
      result[key].push(data[i]);
    } else {
      result[key] = [];
      result[key].push(data[i]);
    }
  }
  return result;
}