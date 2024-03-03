import fsp from 'node:fs/promises';

function rndBetween(start, stop) {
  const len = stop - start;
  return start + (Math.random() * len);
}


(async function() {
  const colNames = [
    'date',
    'cat1',
    'cat2',
    'type',
    'value',
    'high',
    'low',
    'dummy1',
    'dummy2',
  ];
  const dateRange = 2;
  const list = new Set();
  for(let ji = 1; ji <= 3; ji++) {
    const rows = 500 + Math.round(Math.random() * 500);
    const fileName = `data/sample-${ji}.csv`;
    let csv = '';
    csv += colNames.join(',') + '\n';
    for(let i = 0; i < rows; i++) {
      const newLine = colNames.map((colName) => {
        if(colName == 'date') {
          const sd = Math.round(20 + ((ji + 1) * dateRange));
          const fd = sd + dateRange;
          return `2022-11-${Math.round(rndBetween(sd, fd))}`;
        } else if(colName == 'cat1') {
          return `${ji}`;
        } else if(colName== 'cat2') {
          return `${Math.round(rndBetween(1,rows))}`;
        } else if(colName == 'type') {
          return String.fromCodePoint(Math.round(rndBetween('A'.codePointAt(0), 'G'.codePointAt(0))));
        } else if(colName == 'value') {
          return `${-25 + Math.random() * 50}`;
        } else if(colName == 'low') {
          return `${-50 + Math.random() * 25}`;
        } else if(colName == 'high') {
          return `${25 + Math.random() * 25}`;
        }
        return 'NA';
      });
      list.add(`${newLine[0]},${newLine[1]},http://127.0.0.1:5500/${fileName}`);
      csv += newLine.join(',') + '\n';
    }
    await fsp.writeFile(`./${fileName}`, csv);
  }
  const metaLines = Array.from(list.values());
  await fsp.writeFile(`./test/meta.csv`, ('date,cat1,{url}\n' + metaLines.join('\n') + '\n'));
})();