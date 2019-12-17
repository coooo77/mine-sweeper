// BUG  地雷數輸入太大的數，跳出的 alert 通知按了確定後仍會一直出現無法關閉。  =>  先create一個可以執行的，之後再create一個不可執行的

const GAME_STATE = {
  WaitForPlayerClick: "WaitForPlayerClick",
  GameIsOnGoing: "GameIsOnGoing",
  GameOver: "GameOver",
  GameFinished: "GameFinished",
}

const view = {
  /**
   * displayFields()
   * 顯示踩地雷的遊戲版圖在畫面上，
   * 輸入的 rows 是指版圖的行列數。
   */
  displayFields(rows) {
    // 產生rowsXrows個fields
    const numberArray = Array.from(Array(+rows * +rows).keys())
    for (let x = 1; x <= rows; x++) {
      //一個row切割9個field(0~8)
      let field = numberArray.slice(0 + (x - 1) * rows, (x * rows)).map(index => controller.createFieldsElement(index)).join("")
      let row = document.createElement('div')
      row.className = 'rowOfFields'
      row.innerHTML = field
      document.querySelector('#Fields').appendChild(row)
    }
    // 在model詳細紀錄每個field資料
    for (let i = 0; i < (+rows * +rows); i++) {
      let data = {
        dataOfPosition: {
          row: Math.floor(i / rows) + 1,
          column: (i % rows) + 1,
          position: document.querySelector(`div[data-id="${i}"]`),
        },
        numberOfFields: i,
        isDigged: false,
        containMine: false,
        numberOfMinesAround: 0,
        fieldsAround: {
          topField: undefined,
          topRightField: undefined,
          topLeftField: undefined,
          rightField: undefined,
          leftField: undefined,
          bottomField: undefined,
          bottomRightField: undefined,
          bottomLeftField: undefined,
        },
      }
      model.fields.push(data)
    }
  },
  // 重新開始遊戲
  reCreateGame() {
    // 移除所有field
    document.getElementById('Fields').innerHTML = ``
    // 要先重置model到default 或許能使用解構賦值迅速重置，要怎麼寫才好?

    // 資料淨空
    model.mines = [];
    model.fields = [];

    // 重製時間
    model.playTime = 0;
    const timer = document.getElementById('timer');
    timer.innerHTML = `000`;

    model.isStepOnMine = false;
    model.fieldIdJustBeDigged = 0;

    clearInterval(model.timer)
    controller.currentState = GAME_STATE.WaitForPlayerClick
    controller.createGame(model.numberOfRows, model.numberOfMines)
  },
  // 讓className含有containMine的方塊插入炸彈圖片
  renderMinesImage(field) {
    field.innerHTML = `<i class="fas fa-bomb"></i>`
  },
  // 渲染周遭炸彈數量的數字
  renderNumOfMinesAround(field) {
    //數字為0時不給予數字
    if (+field.dataset.numOfMinesAround === 0) {
      return
    } else {
      field.innerHTML = `<p>${field.dataset.numOfMinesAround}</p>`
    }
  },
  // 渲染電影
  renderMovie() {
    const content = document.getElementById('content')
    let htmlContent = `
        <iframe width="560" height="315" src="https://www.youtube.com/embed/_SUgeF32goU" frameborder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    `
    content.innerHTML = htmlContent
  },
  // 渲染使用者紀錄
  renderUserRecord() {
    const content = document.getElementById('content')
    const table = document.createElement('table')
    const thead = `
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Mines</th>
                  <th>Times</th>
                  <th>Status</th>
                </tr>
              </thead>
    `
    table.innerHTML += thead

    const tbody = document.createElement('tbody')
    tbody.id = 'dataPanel'
    let htmlContent = ``
    for (let i = 0; i < model.record.length; i++) {
      htmlContent += `
             <tr>
              <td>${model.record[i].name}</td>
              <td>${model.record[i].size}</td>
              <td>${model.record[i].mines}</td>
              <td>${model.record[i].time}</td>
              <td>${model.record[i].status}</td>
            </tr>
      `
    }
    tbody.innerHTML = htmlContent
    table.appendChild(tbody)

    content.appendChild(table)
  },
  // 安插&拔掉旗子(AddEventListen觸發後使用)
  insertAndRemoveFlag() {
    document.querySelectorAll('.field').forEach(field => {
      field.addEventListener('contextmenu', event => {
        let numberOfFlag = document.querySelectorAll(`.Flag`).length
        if (field.classList.contains('unClick') && !field.classList.contains('Flag') && numberOfFlag < model.numberOfMines) {
          field.classList.add('Flag')
          field.innerHTML = `<i class="fas fa-flag"></i>`
          view.renderNumberOfMine()
        } else if (field.classList.contains('unClick') && field.classList.contains('Flag')) {
          field.children[0].remove()
          field.classList.remove('Flag')
          view.renderNumberOfMine()
        } else {
          return
        }
      })
    })
  },

  // 阻止點右鍵跳出視窗
  stopContextmenuFunction() {
    window.oncontextmenu = function () {
      return false;
    }
  },
  // 執行過就要拔掉，不然會陷入迴圈
  createGameOfUserSetting() {
    const userSettingButton = document.querySelector('#userSettingButton')
    userSettingButton.addEventListener('click', event => {
      if (!model.WaitForUserSetting) {
        view.reCreateGame()
      }
    }, { once: true })
  },
  /**
   * renderTime()
   * 顯示經過的遊戲時間在畫面上。
   */
  renderTime() {
    model.playTime += 1;
    if (model.playTime >= 999) {
      model.playTime = 999
    }

    const timer = document.getElementById('timer');
    const hundreds = Math.floor(+model.playTime / 100);
    const tens = Math.floor(Math.floor(+model.playTime % 100) / 10);
    const units = Math.floor(+model.playTime % 10);

    timer.innerHTML = `${hundreds}${tens}${units}`;
  },
  // 在面板上顯示目前地雷數量
  renderNumberOfMine() {
    const numberOfMine = document.getElementById('numberOfMine');
    const numberOfFlag = document.querySelectorAll('.Flag').length;
    const presumeNumberOfNotDiscoberedMines = model.numberOfMines - numberOfFlag
    const hundreds = Math.floor(+presumeNumberOfNotDiscoberedMines / 100);
    const tens = Math.floor(Math.floor(+presumeNumberOfNotDiscoberedMines % 100) / 10);
    const units = Math.floor(+presumeNumberOfNotDiscoberedMines % 10);
    numberOfMine.innerHTML = `${hundreds}${tens}${units}`;
  },
  /**
   * showBoard()
   * 遊戲結束時，或是 debug 時將遊戲的全部格子內容顯示出來。
   */
  showBoard() {
    document.querySelectorAll('.field').forEach(field => {
      if (field.classList.contains('containMine')) {
        field.classList.remove('unClick')
        view.renderMinesImage(field)
      }
      if (field.classList.contains('unClick')) {
        field.classList.remove('unClick')
        view.renderNumOfMinesAround(field)
      }
    })
  },
  // 作弊，直接把地雷區插旗子
  cheat() {
    document.querySelectorAll('.field').forEach(field => {
      if (field.classList.contains('Flag')) {
        field.classList.remove('Flag')
        field.children[0].remove()
      }
      if (field.classList.contains('containMine')) {
        field.classList.add('Flag')
        field.innerHTML = `<i class="fas fa-flag"></i>`
        view.renderNumberOfMine()
      }
    }
    )
  },
}

const controller = {
  currentState: GAME_STATE.WaitForPlayerClick,
  /**
   * createGame()
   * 根據參數決定遊戲版圖的行列數，以及地雷的數量，
   * 一定要做的事情有：
   *   1. 顯示遊戲畫面
   *   2. 遊戲計時
   *   3. 埋地雷
   *   4. 綁定事件監聽器到格子上
   */
  createGame(numberOfRows, numberOfMines) {
    model.numberOfRows = numberOfRows
    model.numberOfMines = numberOfMines

    view.displayFields(numberOfRows)

    //產生使用者資料
    document.getElementById('content').innerHTML = ''
    view.renderUserRecord()
    this.setDataOfFieldsAround()

    // 在model.tempData中記錄使用者設定
    this.getInputValueFromUserSetting()

    view.stopContextmenuFunction()
    view.insertAndRemoveFlag()
    view.renderNumberOfMine()


    view.createGameOfUserSetting()

    document.querySelectorAll('.field').forEach(field => {
      field.addEventListener('click', event => {
        model.fieldIdJustBeDigged = event.target.dataset.id
        controller.openField(field)
        console.log(`現在狀態`, GAME_STATE[controller.currentState])
      })
    })

    // cheat功能
    document.getElementById('cheat').addEventListener('click', view.cheat)

    // 按下按鈕產生使用者資料
    document.getElementById('navigation').addEventListener('click', event => {
      if (event.target.className === 'navbar-Record') {
        document.getElementById('content').innerHTML = ''
        view.renderUserRecord()
      } else if (event.target.className === 'navbar-Movie') {
        document.getElementById('content').innerHTML = ''
        // 列印電影
        view.renderMovie()
      }
    })
  },
  // 自己設定陣列資料
  getInputValueFromUserSetting() {
    console.log("我是函式，負責記錄使用設定到model中")
    const userSettingButton = document.querySelector('#userSettingButton')
    const userNameInput = document.querySelector('#userNameInput')
    const numberOfMinesInput = document.querySelector('#numberOfMinesInput')
    const rowAndcolumnInput = document.querySelector('#rowAndcolumnInput')
    let name = '';
    let size = 0;
    let mines = 0;
    userSettingButton.addEventListener('click', event => {
      console.log("我是按鈕的監聽器")
      if (userNameInput.value.length === 0) {
        name = 'Anonymous'
      } else if (userNameInput.value.length > 20) {
        alert('名稱太長了，可以麻煩用短一點的名稱嗎?')
      } else {
        name = userNameInput.value
      }
      if (rowAndcolumnInput.value <= 3) {
        alert('地雷區太小啦! 最小Size是4X4 !')
        // 設定錯誤就不進行創造遊戲
        model.WaitForUserSetting = true
      } else if (rowAndcolumnInput.value >= 31) {
        alert('地雷區太大了吧! 最大Size是30X30 !')
        // 設定錯誤就不進行創造遊戲
        model.WaitForUserSetting = true
      } else {
        if (+numberOfMinesInput.value === 0) {
          alert('請至少放一顆地雷！')
          // 設定錯誤就不進行創造遊戲
          model.WaitForUserSetting = true
          // 恢復停止的按鈕監聽器
          view.createGameOfUserSetting()
          view.reCreateGame()
          console.log("BUG?")
        } else if ((9 + +numberOfMinesInput.value) > rowAndcolumnInput.value ** 2) {
          alert('地雷區太小啦! 地雷多到不知道要放哪邊了!!!')
          // 設定錯誤就不進行創造遊戲
          model.WaitForUserSetting = true
          // 恢復停止的按鈕監聽器
          view.createGameOfUserSetting()
          view.reCreateGame()
        } else if (size === rowAndcolumnInput.value && mines === numberOfMinesInput.value) {
          alert('現在遊戲設定已經是您想要的設定了!')
          model.WaitForUserSetting = false
        } else {
          // 先淨空暫時存的使用者資料         
          model.tempRecord = [];

          model.WaitForUserSetting = false
          size = rowAndcolumnInput.value;
          mines = numberOfMinesInput.value;
          // 紀錄使用者資料，給遊戲紀錄顯示 
          model.numberOfRows = size;
          model.numberOfMines = mines;
          let setting = {
            name,
            size,
            mines,
            time: 'Unknow',
            status: 'Unknow'
          }
          model.tempRecord.push(setting)
        }
      }
    }, { once: true })
  },
  // 點開field，由dig(field)判斷是挖到什麼 (使用switch分類遊戲狀態)
  openField(field) {
    if (!field.classList.contains('unClick')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.WaitForPlayerClick:
        this.createMines(model.fields.length, model.numberOfMines)
        // this.setDataOfFieldsAround()
        this.setDataOfNumberOfMinesAround()
        this.giveNumOfMinesByDatasetInFields()
        this.dig(field)
        // 要排除第一次點擊就獲勝的情況
        if (controller.currentState === GAME_STATE.GameFinished) {
          return
        } else if (controller.currentState === GAME_STATE.WaitForPlayerClick) {
          controller.currentState = GAME_STATE.GameIsOnGoing
          // 計時開始
          model.timer = setInterval('view.renderTime()', 1000)
        }
        return
      case GAME_STATE.GameIsOnGoing:

        this.dig(field)
        return
    }

  },
  /**
    * dig()
    * 使用者挖格子時要執行的函式，
    * 會根據挖下的格子內容不同，執行不同的動作，
    * 如果是號碼或海洋 => 顯示格子
    * 如果是地雷      => 遊戲結束
    */
  dig(field) {
    // 挖格子時，就紀錄model內field資料    
    model.fields[field.dataset.id].isDigged = true;
    if (model.isMine(+field.dataset.id)) {
      field.classList.remove('unClick')
      view.renderMinesImage(field)
      field.classList.add('red')
      controller.currentState = GAME_STATE.GameOver
      alert('你挖到地雷了!')
      view.showBoard()

      // 計時暫停
      clearInterval(model.timer)
      // 記錄使用者的遊戲時間與狀態
      controller.recordResult('LOSE')
      //產生使用者資料
      document.getElementById('content').innerHTML = ''
      view.renderUserRecord()

    } else if (field.classList.contains('unClick')) {
      controller.clickFieldsAround(field)
      // 判斷全部安全區是某已經點擊完畢      
      if (+ model.mines.length === +document.querySelectorAll('.unClick').length) {
        controller.currentState = GAME_STATE.GameFinished
        alert('地雷已經全部偵測完畢!')

        // 計時暫停
        clearInterval(model.timer)
        // 記錄使用者的遊戲時間與狀態
        controller.recordResult('WIN')
        //產生使用者資料
        document.getElementById('content').innerHTML = ''
        view.renderUserRecord()

      }
    }
  },
  // 紀錄遊戲時間與結果
  recordResult(result) {
    let WinOrLose = result.toString();
    let timeOfRecord = model.playTime
    if (timeOfRecord > 999) {
      timeOfRecord = 999
    }
    const name = model.tempRecord[0].name;
    const size = model.tempRecord[0].size;
    const mines = model.tempRecord[0].mines;
    const time = timeOfRecord;
    const status = WinOrLose;

    let record = {
      name,
      size,
      mines,
      time,
      status,
    }

    model.record.push(record)

    // 以下方法有BUG，好像因為by Reference的緣故，導致存進去的資料一起變動了... ，但是不知道在哪邊，在想是不是使用let或const的問題;發現新的使用者設定可以讓資料不會一起變動，或許可以用在這邊讓資料獨立出來?
    // let timeOfRecord = model.playTime
    // if (timeOfRecord > 999) {
    //   timeOfRecord = 999
    // }
    // model.tempRecord[0].time = timeOfRecord
    // model.tempRecord[0].status = `${status}`;

    // let record = model.tempRecord[0]
    // 這樣是不是代表我一直塞 model.tempRecord[0]進去，然後改動model.tempRecord[0]時，所以才會一起變動?
    // model.record.push(record)

  },
  clickFieldsAround(field) {
    // 如果點開的是空白，那就展開
    if (+field.dataset.numOfMinesAround === 0) {
      // 先點開中心
      field.classList.remove('unClick')
      view.renderNumOfMinesAround(field)
      // 點開周圍八個沒有地雷的
      let findFieldsAroundDontContainMine = controller.findFieldsAroundWithoutUndefined(field).filter(field => model.fields[field.dataset.id].containMine === false)
      findFieldsAroundDontContainMine.forEach(field => {
        field.classList.remove('unClick')
        view.renderNumOfMinesAround(field)
        // 如果點選的八個field有周遭都沒有地雷的類型(也就是海洋?)，進入循環
        if (+field.dataset.numOfMinesAround === 0) {
          controller.clickFieldsAroundWithoutMines(field)
        }
      })
      // 如果點開的是數字，那就只會點開數字
    } else if (+field.dataset.numOfMinesAround !== 0) {
      field.classList.remove('unClick')
      view.renderNumOfMinesAround(field)
    }
  },
  clickFieldsAroundWithoutMines(field) {

    // 找到周遭尚未點開(unClick)、沒有地雷的區域的海洋 
    // 這邊有點尷尬，.filter不知道有沒有按照指定的條件，按照順序篩選的簡略寫法
    let findFieldsAroundDontContainMine = controller.findFieldsAroundWithoutUndefined(field).filter(field => field.classList.contains('unClick')).filter(field => model.fields[field.dataset.id].containMine === false).filter(field => +field.dataset.numOfMinesAround === 0)
    // 若找不到海洋，代表周遭都是數字 > 點開周圍數字
    if (findFieldsAroundDontContainMine.length === 0) {
      findFieldsAroundDontContainMine = controller.findFieldsAroundWithoutUndefined(field).filter(field => field.classList.contains('unClick')).filter(field => model.fields[field.dataset.id].containMine === false)

      findFieldsAroundDontContainMine.forEach(field => {
        field.classList.remove('unClick')
        view.renderNumOfMinesAround(field)
      })
    } else if (findFieldsAroundDontContainMine.length !== 0) {
      findFieldsAroundDontContainMine.forEach(field => {
        controller.clickFieldsAround(field)
      })
    }
  },
  // 產生隨機位置的炸彈 totalFields=總共方塊數量;numOfMines=放置炸彈的數量
  createMines(totalFields, numOfMines) {
    // 產生隨機放置地雷的順序
    const totalFieldsArray = utility.getRandomNumberArray(totalFields)
    // 但這個順序不會包含到第一次點擊的位置
    // 根據觀察，踩地雷第一次點擊的位置必定是沒有數字的區域，代表點擊的位置周遭八個位置不會包含在地雷區當中，也就是說，總共的地雷區至少要大於等於(8(周圍8個)+1(點擊的位置)+指定地雷數量)  

    // 找到第一次點擊的位置周遭的field
    let fieldsMustWithoutMines = this.findFieldsAroundWithoutUndefined(model.fields[model.fieldIdJustBeDigged].dataOfPosition.position)
    // 從可以選擇的地雷區中排除第一次點擊的位置周遭的field
    fieldsMustWithoutMines.forEach(field => {
      totalFieldsArray.splice(totalFieldsArray.indexOf(+field.dataset.id), 1)
    })
    // 從可以選擇的地雷區中排除第一次點擊的field
    totalFieldsArray.splice(totalFieldsArray.indexOf(+model.fieldIdJustBeDigged), 1)
    // 從這些位置中，取指定數量的位置，建立地雷位置
    const positions = totalFieldsArray.slice(0, numOfMines);
    // 紀錄有地雷的field到model的fields中
    model.mines.push(...positions)

    positions.forEach(positionOfMine => {
      model.fields[positionOfMine].containMine = true
    })
    positions.map(position => document.querySelector(`div[data-id="${position}"]`).classList.add(`containMine`))
  },
  //產生方塊樣式 index=每個方塊的編號，用dataset方式記錄
  createFieldsElement(index) {
    return `
      <div class="field unClick" data-id="${index}">
      </div> 
      `
  },
  // 用Dataset方式記錄方塊周遭有多少個炸彈
  giveNumOfMinesByDatasetInFields() {
    document.querySelectorAll('.field').forEach(field => {
      field.dataset.numOfMinesAround = model.fields[field.dataset.id].numberOfMinesAround
    })

  },

  //把每個field丟下去檢驗看該field周圍是誰
  setDataOfFieldsAround() {
    document.querySelectorAll('.field').forEach(field => {
      controller.findFieldsAround(field)
    })
  },
  // 尋找周圍的field是誰，紀錄在model中
  findFieldsAround(field) {
    const idOfCenterField = field.dataset.id
    const rowOfCenterField = model.fields[idOfCenterField].dataOfPosition.row
    const columnOfCenterField = model.fields[idOfCenterField].dataOfPosition.column
    for (let i = 0; i < model.fields.length; i++) {
      let testField = model.fields[i]
      // 在檢驗的field的上面field，其相對位置是檢驗的field的row-1,column+0
      if (testField.dataOfPosition.row === rowOfCenterField - 1 && testField.dataOfPosition.column === columnOfCenterField + 0) {
        model.fields[idOfCenterField].fieldsAround.topField = testField.dataOfPosition.position
      }
      // 在檢驗的field的上右field，其相對位置是檢驗的field的row-1,column+1
      if (testField.dataOfPosition.row === rowOfCenterField - 1 && testField.dataOfPosition.column === columnOfCenterField + 1) {
        model.fields[idOfCenterField].fieldsAround.topRightField = testField.dataOfPosition.position
      }
      // 在檢驗的field的上左field，其相對位置是檢驗的field的row-1,column-1
      if (testField.dataOfPosition.row === rowOfCenterField - 1 && testField.dataOfPosition.column === columnOfCenterField - 1) {
        model.fields[idOfCenterField].fieldsAround.topLeftField = testField.dataOfPosition.position
      }
      // 在檢驗的field的右邊field，其相對位置是檢驗的field的row+0,column+1
      if (testField.dataOfPosition.row === rowOfCenterField + 0 && testField.dataOfPosition.column === columnOfCenterField + 1) {
        model.fields[idOfCenterField].fieldsAround.rightField = testField.dataOfPosition.position
      }
      // 在檢驗的field的左邊field，其相對位置是檢驗的field的row+0,column-1
      if (testField.dataOfPosition.row === rowOfCenterField + 0 && testField.dataOfPosition.column === columnOfCenterField - 1) {
        model.fields[idOfCenterField].fieldsAround.leftField = testField.dataOfPosition.position
      }
      // 在檢驗的field的下面field，其相對位置是檢驗的field的row+1,column+0
      if (testField.dataOfPosition.row === rowOfCenterField + 1 && testField.dataOfPosition.column === columnOfCenterField + 0) {
        model.fields[idOfCenterField].fieldsAround.bottomField = testField.dataOfPosition.position
      }
      // 在檢驗的field的下右field，其相對位置是檢驗的field的row+1,column+1
      if (testField.dataOfPosition.row === rowOfCenterField + 1 && testField.dataOfPosition.column === columnOfCenterField + 1) {
        model.fields[idOfCenterField].fieldsAround.bottomRightField = testField.dataOfPosition.position
      }
      // 在檢驗的field的下左field，其相對位置是檢驗的field的row+1,column-1
      if (testField.dataOfPosition.row === rowOfCenterField + 1 && testField.dataOfPosition.column === columnOfCenterField - 1) {
        model.fields[idOfCenterField].fieldsAround.bottomLeftField = testField.dataOfPosition.position
      }
    }
  },
  setDataOfNumberOfMinesAround() {
    document.querySelectorAll('.field').forEach(field => {
      controller.calculationOfMinesAround(field)
    })
  },
  // 檢查比對的資料是不是存在(不存在的資料 === undefined)
  findFieldsAroundWithoutUndefined(field) {

    const dataOfField = model.fields[field.dataset.id].fieldsAround
    const bottomField = dataOfField.bottomField
    const bottomRightField = dataOfField.bottomRightField
    const bottomLeftField = dataOfField.bottomLeftField
    const leftField = dataOfField.leftField
    const rightField = dataOfField.rightField
    const topField = dataOfField.topField
    const topLeftField = dataOfField.topLeftField
    const topRightField = dataOfField.topRightField
    const sites = [bottomField, bottomLeftField, bottomRightField, leftField, rightField, topField, topLeftField, topRightField]
    let positions = []

    // 篩選沒有存在的field
    sites.forEach(site => {
      if (site !== undefined) {
        positions.push(site)
      }
    })
    return positions
  },

  // 計算周圍地雷數量，紀錄在model中
  calculationOfMinesAround(field) {

    let positions = this.findFieldsAroundWithoutUndefined(field)

    // 檢驗是否有地雷
    positions.forEach(position => {
      let count = 0;
      if (position.classList.contains('containMine')) {
        count++
      };
      model.fields[field.dataset.id].numberOfMinesAround += count
    })

  },
}

const model = {
  /**
   * mines
   * 存放地雷的編號（第幾個格子）
   */
  mines: [],
  /**
   * fields
   * 存放格子內容，這裡同學可以自行設計格子的資料型態，
   * 例如：
   * {
   *   type: "number",
   *   number: 1,
   *   isDigged: false
   * }
   */
  fields: [],

  playTime: 0,

  isStepOnMine: false,

  WaitForUserSetting: false,

  numberOfRows: 9,

  numberOfMines: 12,

  fieldIdJustBeDigged: 0,

  tempRecord: [],

  record: [
    { name: "Tom", size: "5", mines: "10", time: "666", status: "WIN" },
    { name: "Tim", size: "6", mines: "11", time: "999", status: "LOSE" },
  ],

  /**
   * isMine()
   * 輸入一個格子編號，並檢查這個編號是否是地雷
   */
  isMine(fieldIdx) {
    return this.mines.includes(fieldIdx)
  }
}

const utility = {
  /**
   * getRandomNumberArray()
   * 取得一個隨機排列的、範圍從 0 到 count參數 的數字陣列。
   * 例如：
   *   getRandomNumberArray(4)
   *     - [3, 0, 1, 2]
   */
  //   getRandomNumberArray(count) {
  //     const number = [...Array(count).keys()]
  //     for (let index = number.length - 1; index > 0; index--) {
  //       let randomIndex = Math.floor(Math.random() * (index + 1))
  //       ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
  //     }

  //     return number
  //   },

  // getRandomNumberArray()換成自己想要的方式
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  },
};

controller.createGame(9, 12)