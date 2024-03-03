import ChartManager from './chartManager';

/**
 * @typedef {Object.<string, string>[]} DataFrame
 */

async function main() {
  /**
   * HTML要素の取得
   */
  /**@type {HTMLCanvasElement} キャンバス */
  const chartCanvas = document.querySelector('#chart');

  const chartGraphSelect = document.querySelector('#chart-graph-select');

  const chartFileSelecter = document.querySelector('#chart-file-selecter');

  const chartFilter = document.querySelector('#chart-filter');
  /**
   * URL取得
   */
  const location = window.location;
  const baseURL = `${location.protocol}//${location.hostname}:${location.port}`;
  /**
   * チャートマネージャーの生成
   */
  const cm = new ChartManager(chartCanvas.getContext('2d'), {
    
  });
  cm.showColumnNames = ['cat2', 'type'];
  /**
   * URLからメタデータを取得
   */
  await cm.fetchMetaData(`${baseURL}/test/meta.csv`);
  /**
   * URLからカラムレベルのデータを取得
   */
  await cm.fetchColumnLevel(`${baseURL}/test/columnLevel.csv`);

  await cm.initFileSelector(chartFileSelecter);

  document.querySelector('#temp-update-button').addEventListener('click', () => {
    cm.updateChart();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  main();
}, false);