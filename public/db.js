let db;
// create new db request
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  // create boject store, set autoincrement to true
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
}

request.onsuccess = function (event) {
  db = event.target.result;

  // check if app is online before reading from db
  if (navigator.online) {
    checkDatabase();
  }
}

request.onerror = function (event) {
  console.log("does not compute", event.target.errorCode);
}

function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}

function checkDatabase() {
  // open transaction on pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // access pending object store
  const store = transaction.objectStore("pending");
  // get all records from store and set to variable
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
          // if success, open transaction on pending db
          const transaction = db.transaction(["pending"], "readwrite");
          // access pending object store
          const store = transaction.objectStore("pending");
          // clear all items in store
          store.clear();
        })
    }
  }
}