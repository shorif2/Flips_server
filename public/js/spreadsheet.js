let container = document.getElementById("spreadsheet");
let hot;
let saveStatus = document.getElementById("saveStatus");

const DEFAULT_ROWS = 101;
const DEFAULT_COLS = 26;
container.style.height = 25 * DEFAULT_ROWS + 25 + "px";
// Generate column headers: A, B, C...
function getColumnHeaders(colCount) {
  const letters = [];
  for (let i = 0; i < colCount; i++) {
    let header = "";
    let n = i;
    do {
      header = String.fromCharCode(65 + (n % 26)) + header; // 65 = 'A'
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    letters.push(header);
  }
  return letters;
}

// Debounce function
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Track unsaved cells
let unsavedCells = new Set();

// Auto-save function
const autoSave = debounce(() => {
  const newData = hot.getData();
  fetch("/ui-spreadsheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newData),
  })
    .then((res) => res.json())
    .then((msg) => {
      saveStatus.textContent = `✅`;
      unsavedCells.clear();
      hot.render();
    })
    .catch((err) => {
      console.error("Auto-save error:", err);
      saveStatus.textContent = `❌`;
      saveStatus.style.color = "red";
    });
}, 1000);

// Fetch data or initialize default
fetch("/ui-spreadsheet")
  .then((res) => res.json())
  .then((data) => {
    if (!data || data.length === 0) {
      data = Array.from({ length: DEFAULT_ROWS }, () =>
        Array(DEFAULT_COLS).fill("")
      );
    } else {
      while (data.length < DEFAULT_ROWS) {
        data.push(Array(data[0].length || DEFAULT_COLS).fill(""));
      }
      data = data.map((row) => {
        while (row.length < DEFAULT_COLS) row.push("");
        return row;
      });
    }

    // Handsontable instance
    hot = new Handsontable(container, {
      data: data,
      rowHeaders: true,
      rowHeaderWidth: 80, // wider row numbers
      colHeaders: getColumnHeaders(data[0].length),
      colWidths: 120, // default column width
      contextMenu: true,
      rowHeights: 25,
      minSpareRows: 0,
      maxRows: DEFAULT_ROWS,
      viewportRowRenderingOffset: 50,
      manualColumnResize: true,
      manualColumnMove: true,
      allowInsertColumn: true,
      allowRemoveColumn: true,
      licenseKey: "non-commercial-and-evaluation",
      width: "100%",
      height: container.offsetHeight,

      // Highlight unsaved cells
      cells: function (row, col) {
        const cellProps = {};
        if (unsavedCells.has(`${row}-${col}`)) {
          cellProps.className = "unsaved-cell";
        }
        return cellProps;
      },

      afterCreateCol: function () {
        hot.updateSettings({ colHeaders: getColumnHeaders(hot.countCols()) });
        autoSave();
      },
      afterRemoveCol: function () {
        hot.updateSettings({ colHeaders: getColumnHeaders(hot.countCols()) });
        autoSave();
      },
      afterChange: function (changes, source) {
        if (source !== "loadData") {
          changes.forEach(([row, col]) => {
            unsavedCells.add(`${row}-${col}`);
          });
          saveStatus.textContent = `⟳`;
          autoSave();
        }
      },
    });

    // Adjust row header width and column widths dynamically based on content
    function adjustSizes() {
      // Adjust row header width
      let maxRowHeader = 0;
      for (let i = 0; i < data.length; i++) {
        maxRowHeader = Math.max(maxRowHeader, String(i + 1).length);
      }
      hot.updateSettings({ rowHeaderWidth: 30 + maxRowHeader * 10 });

      // Adjust column widths based on content
      const newColWidths = [];
      for (let col = 0; col < hot.countCols(); col++) {
        let maxWidth = 110; // minimum width
        for (let row = 0; row < hot.countRows(); row++) {
          const cell = hot.getDataAtCell(row, col);
          if (cell) maxWidth = Math.max(maxWidth, String(cell).length * 10);
        }
        newColWidths.push(maxWidth);
      }
      hot.updateSettings({ colWidths: newColWidths });
    }

    adjustSizes();
    window.addEventListener("resize", () => hot.render());
  });
