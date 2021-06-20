// Document Ready
$(document).ready(function () {
  M.AutoInit(document.body);
  nodeGrid();
  startAceWebsocket();
  fixNavbarHeight();
});

// WebSocket URL Helper
const loc = window.location;
const wsLoc = new URL("./", `${loc.protocol}//${loc.host}${loc.pathname}`);
wsLoc.protocol = "ws:";
if (loc.protocol === "https:") {
  wsLoc.protocol = "wss:";
}
const wsUrl = wsLoc.href;

/**
 * Fix NavBar height
 */
const fixNavbarHeight = () => {
  const fixFunc = () => {
    const sel = $(".select-wrapper");
    $(".navbar-fixed").css(
      "height",
      sel.position().top + sel.outerHeight() + "px"
    );
  };
  $(window).resize(fixFunc);
  fixFunc();
};

/**
 *  Dashboard Dynamic Grid
 */
const nodeGrid = () => {
  const nodeCount = document.querySelectorAll("#nodes .card").length;
  const nodeGrid = document.querySelector("#nodes #grid");

  if (nodeCount <= 3) {
    nodeGrid.classList.add("grid-1-col");
  } else if (nodeCount <= 6) {
    nodeGrid.classList.add("grid-2-col");
  } else {
    nodeGrid.classList.add("grid-3-col");
  }
};

/**
 *  Serial Port Selection
 */

const portSelect = document.querySelector(".nav-wrapper select");
let ports = [];

const fetchSerialPorts = (begin = false) => {
  fetch(`./serial-ports`, { credentials: "same-origin" })
    .then((res) => res.json())
    .then((response) => {
      if (ports.length === response.length) {
        let allEqual = true;
        for (let i = 0; i < response.length; i++) {
          if (ports[i].port !== response[i].port) {
            allEqual = false;
            break;
          }
        }
        if (allEqual) return;
      }
      const hasNewPort = response.length >= ports.length;

      ports = response;

      const inst = M.FormSelect.getInstance(portSelect);
      if (inst !== undefined) {
        inst.destroy();
      }

      portSelect.innerHTML = "";
      const prevSelected = getUploadPort();
      for (let i = 0; i < response.length; i++) {
        const val = response[i];
        if (val.port === prevSelected) {
          portSelect.innerHTML += `<option value="${val.port}" selected>${val.port} (${val.desc})</option>`;
        } else {
          portSelect.innerHTML += `<option value="${val.port}">${val.port} (${val.desc})</option>`;
        }
      }

      M.FormSelect.init(portSelect, {});
      if (!begin && hasNewPort)
        M.toast({ html: "Discovered new serial port." });
    });
};

export const getUploadPort = () => {
  const inst = M.FormSelect.getInstance(portSelect);
  if (inst === undefined) {
    return "OTA";
  }

  inst._setSelectedStates();
  return inst.getSelectedValues()[0] || "OTA";
};
setInterval(fetchSerialPorts, 5000);
fetchSerialPorts(true);

/**
 *  Node Editing
 */

let editorActiveFilename = null;
let editorActiveSecrets = false;
let editorActiveWebSocket = null;
let editorValidationScheduled = false;
let editorValidationRunning = false;

// Setup Editor
const editorElement = document.querySelector(
  "#js-editor-modal #js-editor-area"
);
const editor = ace.edit(editorElement);

editor.setOptions({
  highlightActiveLine: true,
  showPrintMargin: true,
  useSoftTabs: true,
  tabSize: 2,
  useWorker: false,
  theme: "ace/theme/dreamweaver",
  mode: "ace/mode/yaml",
});

editor.commands.addCommand({
  name: "saveCommand",
  bindKey: { win: "Ctrl-S", mac: "Command-S" },
  exec: function () {
    saveFile(editorActiveFilename);
  },
  readOnly: false,
});

export const openEditDialog = (filename) => {
  editorActiveFilename = filename;
  const filenameField = document.querySelector(
    "#js-editor-modal #js-node-filename"
  );
  filenameField.innerHTML = editorActiveFilename;

  const saveButton = document.querySelector(
    "#js-editor-modal [data-action='save']"
  );
  const uploadButton = document.querySelector(
    "#js-editor-modal [data-action='upload']"
  );
  const closeButton = document.querySelector(
    "#js-editor-modal [data-action='close']"
  );
  saveButton.setAttribute("data-filename", editorActiveFilename);
  uploadButton.setAttribute("data-filename", editorActiveFilename);
  uploadButton.setAttribute("onClick", `saveFile("${editorActiveFilename}")`);
  if (editorActiveFilename === "secrets.yaml") {
    uploadButton.classList.add("disabled");
    editorActiveSecrets = true;
  } else {
    uploadButton.classList.remove("disabled");
    editorActiveSecrets = false;
  }
  closeButton.setAttribute("data-filename", editorActiveFilename);

  const loadingIndicator = document.querySelector(
    "#js-editor-modal #js-loading-indicator"
  );
  const editorArea = document.querySelector("#js-editor-modal #js-editor-area");

  loadingIndicator.style.display = "block";
  editorArea.style.display = "none";

  editor.setOption("readOnly", true);
  fetch(`./edit?configuration=${editorActiveFilename}`, {
    credentials: "same-origin",
  })
    .then((res) => res.text())
    .then((response) => {
      editor.setValue(response, -1);
      editor.setOption("readOnly", false);
      loadingIndicator.style.display = "none";
      editorArea.style.display = "block";
    });
  editor.focus();

  const editModalElement = document.getElementById("js-editor-modal");
  const editorModal = M.Modal.init(editModalElement, {
    onOpenStart: function () {
      editorModalOnOpen();
    },
    onCloseStart: function () {
      editorModalOnClose();
    },
    dismissible: false,
  });

  editorModal.open();
};

// Edit Button Listener
document.querySelectorAll("[data-action='edit']").forEach((button) => {
  button.addEventListener("click", (event) => {
    openEditDialog(event.target.dataset.filename);
  });
});

// Editor On Open
const editorModalOnOpen = () => {
  return;
};

// Editor On Close
const editorModalOnClose = () => {
  editorActiveFilename = null;
};

// Editor WebSocket Validation
const startAceWebsocket = () => {
  editorActiveWebSocket = new WebSocket(`${wsUrl}ace`);

  editorActiveWebSocket.addEventListener("message", (event) => {
    const raw = JSON.parse(event.data);
    if (raw.event === "line") {
      const msg = JSON.parse(raw.data);
      if (msg.type === "result") {
        const arr = [];

        for (const v of msg.validation_errors) {
          let o = {
            text: v.message,
            type: "error",
            row: 0,
            column: 0,
          };
          if (v.range != null) {
            o.row = v.range.start_line;
            o.column = v.range.start_col;
          }
          arr.push(o);
        }
        for (const v of msg.yaml_errors) {
          arr.push({
            text: v.message,
            type: "error",
            row: 0,
            column: 0,
          });
        }

        editor.session.setAnnotations(arr);

        if (arr.length) {
          document
            .querySelector("#js-editor-modal [data-action='upload']")
            .classList.add("disabled");
        } else {
          document
            .querySelector("#js-editor-modal [data-action='upload']")
            .classList.remove("disabled");
        }

        editorValidationRunning = false;
      } else if (msg.type === "read_file") {
        sendAceStdin({
          type: "file_response",
          content: editor.getValue(),
        });
      }
    }
  });

  editorActiveWebSocket.addEventListener("open", () => {
    const msg = JSON.stringify({ type: "spawn" });
    editorActiveWebSocket.send(msg);
  });

  editorActiveWebSocket.addEventListener("close", () => {
    editorActiveWebSocket = null;
    setTimeout(startAceWebsocket, 5000);
  });
};

const sendAceStdin = (data) => {
  let send = JSON.stringify({
    type: "stdin",
    data: JSON.stringify(data) + "\n",
  });
  editorActiveWebSocket.send(send);
};

const debounce = (func, wait) => {
  let timeout;
  return function () {
    let context = this,
      args = arguments;
    let later = function () {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

editor.session.on(
  "change",
  debounce(() => {
    editorValidationScheduled = !editorActiveSecrets;
  }, 250)
);

setInterval(() => {
  if (!editorValidationScheduled || editorValidationRunning) return;
  if (editorActiveWebSocket == null) return;

  sendAceStdin({
    type: "validate",
    file: editorActiveFilename,
  });
  editorValidationRunning = true;
  editorValidationScheduled = false;
}, 100);

// Save File
const saveFile = (filename) => {
  const extensionRegex = new RegExp("(?:.([^.]+))?$");

  if (filename.match(extensionRegex)[0] !== ".yaml") {
    M.toast({
      html: `❌ File <code class="inlinecode">${filename}</code> cannot be saved as it is not a YAML file!`,
      displayLength: 10000,
    });
    return;
  }

  fetch(`./edit?configuration=${filename}`, {
    credentials: "same-origin",
    method: "POST",
    body: editor.getValue(),
  })
    .then((response) => {
      response.text();
    })
    .then(() => {
      M.toast({
        html: `✅ Saved <code class="inlinecode">${filename}</code>`,
        displayLength: 10000,
      });
    })
    .catch((error) => {
      M.toast({
        html: `❌ An error occured saving <code class="inlinecode">${filename}</code>`,
        displayLength: 10000,
      });
    });
};

document.querySelectorAll("[data-action='save']").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    saveFile(editorActiveFilename);
  });
});

// Delete Node
document.querySelectorAll("[data-action='delete']").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const filename = e.target.getAttribute("data-filename");

    fetch(`./delete?configuration=${filename}`, {
      credentials: "same-origin",
      method: "POST",
    })
      .then((res) => {
        res.text();
      })
      .then(() => {
        const toastHtml = `<span>🗑️ Deleted <code class="inlinecode">${filename}</code>
                           <button class="btn-flat toast-action">Undo</button>`;
        const toast = M.toast({
          html: toastHtml,
          displayLength: 10000,
        });
        const undoButton = toast.el.querySelector(".toast-action");

        document.querySelector(`.card[data-filename="${filename}"]`).remove();

        undoButton.addEventListener("click", () => {
          fetch(`./undo-delete?configuration=${filename}`, {
            credentials: "same-origin",
            method: "POST",
          })
            .then((res) => {
              res.text();
            })
            .then(() => {
              window.location.reload(false);
            });
        });
      });
  });
});
