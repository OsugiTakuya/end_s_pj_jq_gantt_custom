"use strict";

// 参考：https://github.com/ateliee/jquery.schedule

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

(function ($) {
  'use strict';

  var PLUGIN_NAME = 'jqSchedule';
  var methods = {
    /**
     *
     * @param {string} str
     * @returns {number}
     */
    calcStringTime: function calcStringTime(str) {
      var slice = str.split(':');
      var h = Number(slice[0]) * 60 * 60;
      var i = Number(slice[1]) * 60;
      return h + i;
    },

    /**
     *
     * @param {number} val
     * @returns {string}
     */
    formatTime: function formatTime(val) {
      var i1 = val % 3600;
      var h = '' + Math.floor(val / 36000) + Math.floor(val / 3600 % 10);
      var i = '' + Math.floor(i1 / 600) + Math.floor(i1 / 60 % 10);
      return h + ':' + i;
    },

    /**
     * 設定データの保存
     * （dataWidth, draggable, endTime, rows..等、初期化時に渡した変数など）
     *
     * @param {Options} data
     * @returns {*}
     */
    _saveSettingData: function _saveSettingData(data) {
      return this.data(PLUGIN_NAME + 'Setting', data);
    },

    /**
     * 設定データの取得
     * （dataWidth, draggable, endTime, rows..等、初期化時に渡した変数など）
     *
     * @returns Options
     */
    _loadSettingData: function _loadSettingData() {
      return this.data(PLUGIN_NAME + 'Setting');
    },

    /**
     * 保存データの保存
     * （timeline(各行の情報:titleやschedule), tableStartTime, tableEndTime
     * 　schedule(ボックスのstart,end,text等)など）
     *
     * @param {SaveData} data
     * @returns {*}
     */
    _saveData: function _saveData(data) {
      var d = $.extend({
        tableStartTime: 0,
        tableEndTime: 0,
        schedule: [],
        timeline: []
      }, data);
      return this.data(PLUGIN_NAME, d);
    },

    /**
     * 保存データの取得
     * （timeline(各行の情報:titleやschedule), tableStartTime, tableEndTime
     * 　schedule(ボックスのstart,end,text等)など）
     *
     * @returns SaveData
     */
    _loadData: function _loadData() {
      return this.data(PLUGIN_NAME);
    },

    /**
     * スケジュールの取得
     *
     * @returns ScheduleData[]
     */
    scheduleData: function scheduleData() {
      var $this = $(this);

      var saveData = methods._loadData.apply($this);

      if (saveData) {
        return saveData.schedule;
      }

      return [];
    },

    /**
     * get timelineData
     * @returns {any[]}
     */
    timelineData: function timelineData() {
      var $this = $(this);

      var saveData = methods._loadData.apply($this);

      var data = [];
      var i;

      for (i in saveData.timeline) {
        data[i] = saveData.timeline[i];
        data[i].schedule = [];
      }

      for (i in saveData.schedule) {
        var d = saveData.schedule[i];

        if (typeof d.timeline === 'undefined') {
          continue;
        }

        if (typeof data[d.timeline] === 'undefined') {
          continue;
        }

        data[d.timeline].schedule.push(d);
      }

      return data;
    },

    /**
     * reset data
     */
    resetData: function resetData() {
      return this.each(function () {
        var $this = $(this);

        var saveData = methods._loadData.apply($this);

        saveData.schedule = [];

        methods._saveData.apply($this, [saveData]);

        $this.find('.sc_bar').remove();

        for (var i in saveData.timeline) {
          saveData.timeline[i].schedule = [];

          methods._resizeRow.apply($this, [i, 0]);
        }

        methods._saveData.apply($this, [saveData]);
      });
    },

    /**
     * add schedule data
     *
     * @param {number} timeline
     * @param {object} data
     * @returns {methods}
     */
    addSchedule: function addSchedule(timeline, data) {
      // 引数チェック（timelineが既に存在する or -1であるか）
      var saveData = methods._loadData.apply($(this));
      var timeline_array = Object.keys(saveData.timeline);
      timeline_array = timeline_array.map(k => +k)  // 整数化
      if (!(timeline_array.includes(timeline)) || timeline==-1) {
        throw new Error('addSchedule: timeline='+timeline+' は存在しない');
      }

      return this.each(function () {
        var $this = $(this);
        var d = {
          start: data.start,
          end: data.end,
          startTime: methods.calcStringTime(data.start),
          endTime: methods.calcStringTime(data.end),
          text: data.text,
          timeline: timeline
        };

        if (data.data) {
          d.data = data.data;
        }

        methods._addScheduleData.apply($this, [timeline, d]);

        methods._resetBarPosition.apply($this, [timeline]);
      });
    },

    /**
     * add schedule data
     *
     * @param {number} timeline
     * @param {object} data
     * @returns {methods}
     */
    addRow: function addRow(timeline, data) {
      // 引数チェック（timelineが存在しないものであるか）
      var saveData = methods._loadData.apply($(this));
      var timeline_array = Object.keys(saveData.timeline);
      timeline_array = timeline_array.map(k => +k)  // 整数化
      if (timeline_array.includes(timeline) || timeline!=-1) {
        throw new Error('addRow: timeline='+timeline+' は既に存在');
      }

      return this.each(function () {
        var $this = $(this);

        methods._addRow.apply($this, [timeline, data]);
      });
    },

    /**
     * clear row
     *
     * @returns {methods}
     */
    resetRowData: function resetRowData() {
      return this.each(function () {
        var $this = $(this);

        var data = methods._loadData.apply($this);

        data.schedule = [];
        data.timeline = [];

        methods._saveData.apply($this, [data]);

        $this.find('.sc_bar').remove();
        $this.find('.timeline').remove();
        $this.find('.sc_data').height(0);
      });
    },

    /**
     * clear row
     *
     * @param {object} data
     * @returns {methods}
     */
    setRows: function setRows(data) {
      return this.each(function () {
        var $this = $(this);
        methods.resetRowData.apply($this, []);

        for (var timeline in data) {
          methods.addRow.apply($this, [timeline, data[timeline]]);
        }
      });
    },

    /**
     * switch draggable
     * @param {boolean} enable
     */
    setDraggable: function setDraggable(enable) {
      return this.each(function () {
        var $this = $(this);

        var setting = methods._loadSettingData.apply($this);

        if (enable !== setting.draggable) {
          setting.draggable = enable;

          methods._saveSettingData.apply($this, setting);

          if (enable) {
            $this.find('.sc_bar').draggable('enable');
          } else {
            $this.find('.sc_bar').draggable('disable');
          }
        }
      });
    },

    /**
     * switch resizable
     * @param {boolean} enable
     */
    setResizable: function setResizable(enable) {
      return this.each(function () {
        var $this = $(this);

        var setting = methods._loadSettingData.apply($this);

        if (enable !== setting.resizable) {
          setting.resizable = enable;

          methods._saveSettingData.apply($this, setting);

          if (enable) {
            $this.find('.sc_bar').resizable('enable');
          } else {
            $this.find('.sc_bar').resizable('disable');
          }
        }
      });
    },

    /**
     * 現在のタイムライン番号を取得
     *
     * @param node
     * @param top - 移動前からの相対位置
     * @returns {number} - この戻り値は何？？（0か1しか出ない？この戻り値がどこにも使われていない？？）
     */
    _getTimeLineNumber: function _getTimeLineNumber(node, top) {
      var $this = $(this);

      var setting = methods._loadSettingData.apply($this);

      var num = 0;
      var n = 0;
      var tn = Math.ceil(top / (setting.timeLineY + setting.timeLinePaddingTop + setting.timeLinePaddingBottom));  // 何行分動いたか

      for (var i in setting.rows) {
        var r = setting.rows[i];
        var tr = 0;

        if (_typeof(r.schedule) === 'object') {
          tr = r.schedule.length;  // i行目に何行あるか
        }

        if (node && node.timeline) {  // どのような時に入る？？
          tr++;
        }

        n += Math.max(tr, 1);

        if (n >= tn) {
          break;
        }

        num++;
      }

      return num;
    },

    /**
     * 背景データ追加
     *
     * @param {ScheduleData} data
     */
    _addScheduleBgData: function _addScheduleBgData(data) {
      return this.each(function () {
        var $this = $(this);

        var setting = methods._loadSettingData.apply($this);

        var saveData = methods._loadData.apply($this);

        var st = Math.ceil((data.startTime - saveData.tableStartTime) / setting.widthTime);
        var et = Math.floor((data.endTime - saveData.tableStartTime) / setting.widthTime);
        var $bar = $('<div class="sc_bgBar"><span class="text"></span></div>');
        $bar.css({
          left: st * setting.widthTimeX,
          top: 0,
          width: (et - st) * setting.widthTimeX,
          height: $this.find('.sc_main .timeline').eq(data.timeline).height()
        });

        if (data.text) {
          $bar.find('.text').text(data.text);
        }

        if (data.class) {
          $bar.addClass(data.class);
        } // $element.find('.sc_main').append($bar);


        $this.find('.sc_main .timeline').eq(data.timeline).append($bar);
      });
    },

    /**
     * スケジュール追加
     *
     * @param {number} timeline - 行id（0始まりインデックス, -1ならガントチャート置き場）
     * @param {object} d - ガントチャートの1ボックスのstart,end,data,..など
     * @returns {number}
     */
    _addScheduleData: function _addScheduleData(timeline, d) {
      // 引数チェック
      if (!(timeline >= -1 && Number.isInteger(timeline))) {
        throw new Error("_addScheduleData関数の引数エラー", timeline, typeof(timeline));
      }

      var data = d;
      data.startTime = data.startTime ? data.startTime : methods.calcStringTime(data.start);
      data.endTime = data.endTime ? data.endTime : methods.calcStringTime(data.end);

      // ↓thisはfunction()の中・外とも[div#schedule]。eachは1ループしかしていない
      return this.each(function () {
        var $this = $(this);

        var setting = methods._loadSettingData.apply($this);

        var saveData = methods._loadData.apply($this);

        var st = Math.ceil((data.startTime - saveData.tableStartTime) / setting.widthTime);  // 全体の開始時刻～ボックスの開始時刻が何マス分か
        var et = Math.floor((data.endTime - saveData.tableStartTime) / setting.widthTime);
        // ガントチャートのボックス1つ分
        var $bar = $('\
          <div class="sc_bar">\
            <span class="head">\
              <span class="time"></span>\
            </span>\
            <span class="text"></span>\
          </div>');
        var stext = methods.formatTime(data.startTime);
        var etext = methods.formatTime(data.endTime);

        // ボックスが時刻軸上の時の初期設定
        if (timeline != -1) {
          // timeline行にボックスが既にいくつ存在するか
          var snum = methods._getScheduleCount.apply($this, [data.timeline]);
          
          // ボックスの位置
          $bar.css({
            left: st * setting.widthTimeX,
            top: snum * setting.timeLineY + setting.timeLinePaddingTop,
            width: (et - st) * setting.widthTimeX,
            height: setting.timeLineY
          });

          // ボックスに表示する時刻テキスト
          $bar.find('.time').text(stext + '-' + etext);
        
        // ボックスがガントチャート置き場上の時の初期設定
        } else {
          // ガントチャート置き場にすでにいくつ存在するか
          var snum = methods._getScheduleCount.apply($this, [data.timeline]);
          // ボックスの位置（ガントチャート置き場上で重複が少なくなるよう）
          $bar.css({
            left: st * setting.widthTimeX,
            top: snum * setting.timeLineY + setting.timeLinePaddingTop,
            width: (et - st) * setting.widthTimeX,
            height: setting.timeLineY
          });

          // ボックスに表示する時刻テキスト
          $bar.find('.time').text('xx:xx-xx:xx');
        }
        
        // ボックスに表示するテキスト
        if (data.text) {
          $bar.find('.text').text(data.text);
        }

        if (data.class) {
          $bar.addClass(data.class);
        }

        // データの追加
        var $row = $this.find('.sc_main .timeline').eq(timeline);
        $row.append($bar);

        saveData.schedule.push(data);

        methods._saveData.apply($this, [saveData]);

        // コールバックがセットされていたら呼出
        if (setting.onAppendSchedule) {
          setting.onAppendSchedule.apply($this, [$bar, data]);
        }
        
        // key
        var key = saveData.schedule.length - 1;  // 全体で0始まりのボックスid
        $bar.data('sc_key', key);

        $bar.on('mouseup', function () {
          // コールバックがセットされていたら呼出
          if (setting.onClick) {
            if ($(this).data('dragCheck') !== true && $(this).data('resizeCheck') !== true) {
              var $n = $(this);
              var scKey = $n.data('sc_key');
              setting.onClick.apply($this, [$n, saveData.schedule[scKey]]);
            }
          }
        });

        // ボックスのドラッグの設定
        var $node = $this.find('.sc_bar');
        var currentNode = null;

        $node.draggable({
          grid: [setting.widthTimeX, 1],  // グリッドに沿って移動
          containment: $this.find('.sc_main'),  // 移動範囲
          // containment: $this.find('.sc_draggable_wrapper'),  // 移動範囲
          helper: 'original',  // original:そのまま移動, clone:元の要素を残したまま移動
          // scroll: 'false',
          start: function start(event, ui) {  // ドラッグ開始時に呼び出される関数
            var node = {};
            node.node = this;
            node.offsetTop = ui.position.top;
            node.offsetLeft = ui.position.left;
            node.currentTop = ui.position.top;
            node.currentLeft = ui.position.left;
            node.timeline = methods._getTimeLineNumber.apply($this, [currentNode, ui.position.top]);
            node.nowTimeline = node.timeline;
            currentNode = node;
          },

          /**
           *
           * @param {Event} event
           * @param {function} ui
           * @returns {boolean}
           */
          drag: function drag(event, ui) {  // ドラッグ時に呼び出される関数
            $(this).data('dragCheck', true);

            if (!currentNode) {
              return false;
            }

            var $moveNode = $(this);
            var scKey = $moveNode.data('sc_key');
            
            // 現在のボックスの座標から行番号を取得（→各行の行番号？？）
            var timelineNum = methods._getTimeLineNumber.apply($this, [currentNode, ui.position.top]);
            
            // eslint-disable-next-line no-param-reassign
            ui.position.left = Math.floor(ui.position.left / setting.widthTimeX) * setting.widthTimeX;

            // 縦方向のスクロールバーを削除
            // $(".jq-schedule .sc_main_box").css({'overflow-x': 'hidden', 'overflow-y': 'hidden'});
            // $(".jq-schedule .sc_main").css({
            //   'overflow-y': 'hidden', 'height': 500,
            // });

            // // ボックス置き場に出たら移動
            // if (ui.position.top > 300){
            //   // 要素を移動
            //   $moveNode.appendTo('.box_storage');
            // }
            
            // 行番号がドラッグ前後で変わる場合
            if (currentNode.nowTimeline !== timelineNum) {
              // 現在のタイムライン（どこにも使われていない？？）
              currentNode.nowTimeline = timelineNum;
            }

            currentNode.currentTop = ui.position.top;
            currentNode.currentLeft = ui.position.left;
            
            // テキスト変更（時刻とか）
            methods._rewriteBarText.apply($this, [$moveNode, saveData.schedule[scKey]]);

            return true;
          },

          // 要素の移動が終った後の処理
          stop: function stop() {
            $(this).data('dragCheck', false);
            currentNode = null;
            var $n = $(this);
            var scKey = $n.data('sc_key');
            var x = $n.position().left; // var w = $n.width();

            // 移動終了時の座標をグリッドに合わせて取得
            var start = saveData.tableStartTime + Math.floor(x / setting.widthTimeX) * setting.widthTime;
            var end = start + (saveData.schedule[scKey].endTime - saveData.schedule[scKey].startTime);

            saveData.schedule[scKey].start = methods.formatTime(start);
            saveData.schedule[scKey].end = methods.formatTime(end);
            saveData.schedule[scKey].startTime = start;
            saveData.schedule[scKey].endTime = end;
            
            // コールバックがセットされていたら呼出
            if (setting.onChange) {
              setting.onChange.apply($this, [$n, saveData.schedule[scKey]]);
            }
          }
        });

        // resizable: サイズ変更可能なボックスにする
        var resizableHandles = ['e'];  // 右
        if (setting.resizableLeft) {
          resizableHandles.push('w');  // 左
        }
        $node.resizable({
          handles: resizableHandles.join(','),
          grid: [setting.widthTimeX, setting.timeLineY - setting.timeBorder],
          minWidth: setting.widthTimeX,
          containment: $this.find('.sc_main_scroll'),  // リサイズ範囲
          start: function start() {
            var $n = $(this);
            $n.data('resizeCheck', true);
          },
          resize: function resize(ev, ui) {
            // box-sizing: border-box; に対応
            ui.element.height(ui.size.height);
            ui.element.width(ui.size.width);
          },
          // 要素の移動が終った後の処理
          stop: function stop() {
            var $n = $(this);
            var scKey = $n.data('sc_key');
            var x = $n.position().left;
            var w = $n.outerWidth();
            var start = saveData.tableStartTime + Math.floor(x / setting.widthTimeX) * setting.widthTime;
            var end = saveData.tableStartTime + Math.floor((x + w) / setting.widthTimeX) * setting.widthTime;
            var timelineNum = saveData.schedule[scKey].timeline;
            saveData.schedule[scKey].start = methods.formatTime(start);
            saveData.schedule[scKey].end = methods.formatTime(end);
            saveData.schedule[scKey].startTime = start;
            saveData.schedule[scKey].endTime = end; // 高さ調整

            methods._resetBarPosition.apply($this, [timelineNum]);
            
            // テキスト変更（時刻とか）
            methods._rewriteBarText.apply($this, [$n, saveData.schedule[scKey]]);

            $n.data('resizeCheck', false);
            
            // コールバックがセットされていたら呼出
            if (setting.onChange) {
              setting.onChange.apply($this, [$n, saveData.schedule[scKey]]);
            }
          }
        });

        if (setting.draggable === false) {
          $node.draggable('disable');
        }

        if (setting.resizable === false) {
          $node.resizable('disable');
        }

        return key;
      });
    },

    /**
     * スケジュール数の取得（ガントチャート置き場上の数もこの関数で処理）
     *
     * @param {number}
     * @returns {number}
     */
    _getScheduleCount: function _getScheduleCount(n) {
      var $this = $(this);

      var saveData = methods._loadData.apply($this);

      var num = 0;

      for (var i in saveData.schedule) {
        if (saveData.schedule[i].timeline === n) {
          num++;
        }
      }

      return num;
    },

    /**
     * add rows
     *
     * @param {Number} timeline - 行番号（0始まり昇順。-1は許さない）
     * @param  {object} row - 各行の情報（.timeSchedule()の引数で与えたrowsの1つ分）
     */
    _addRow: function _addRow(timeline, row) {
      // 引数チェック
      if (!(timeline >= 0 && Number.isInteger(timeline))) {
        throw new Error("_addRow関数の引数エラー", timeline, typeof(timeline));
      }

      return this.each(function () {
        var $this = $(this);

        var setting = methods._loadSettingData.apply($this);

        var saveData = methods._loadData.apply($this);

        // 今から作成する行id = 作成済みの行数（$("#...").eq(id)で要素を取得するため。rowsのキーと同じになる）
        var id = $this.find('.sc_main .timeline').length;
        
        var html;
        html = '';
        html += '<div class="timeline"></div>';  // 各行全体（行名＋ガントチャートが入る箇所）
        var $data = $(html);

        if (row.title) {
          $data.append('<span class="timeline-title">' + row.title + '</span>');  // 行名
        }

        if (row.subtitle) {
          $data.append('<span class="timeline-subtitle">' + row.subtitle + '</span>');
        } // event call


        if (setting.onInitRow) {
          setting.onInitRow.apply($this, [$data, row]);
        }

        $this.find('.sc_data_scroll').append($data);

        // 時刻軸のグリッド線を引く
        html = '';
        html += '<div class="timeline"></div>';
        var $timeline = $(html);
        for (var t = saveData.tableStartTime; t < saveData.tableEndTime; t += setting.widthTime) {
          var $tl = $('<div class="tl"></div>');
          $tl.outerWidth(setting.widthTimeX);  // 時刻軸の横幅
          $tl.data('time', methods.formatTime(t));
          $tl.data('timeline', timeline);
          $timeline.append($tl);
        }
        
        // クリックイベント
        // left click
        $timeline.find('.tl').on('click', function () {
          if (setting.onScheduleClick) {
            setting.onScheduleClick.apply(
              $this,
              [this, $(this).data('time'), $(this).data('timeline'), saveData.timeline[$(this).data('timeline')]]);
          }
        });
        
        // right click
        $timeline.find('.tl').on('contextmenu', function () {
          if (setting.onScheduleClick) {
            setting.onScheduleClick.apply(
              $this,
              [this, $(this).data('time'), $(this).data('timeline'), saveData.timeline[$(this).data('timeline')]]);
          }
          return false;
        });

        // 時刻軸を<sc_main>に追加
        $this.find('.sc_main').append($timeline);
        saveData.timeline[timeline] = row;

        methods._saveData.apply($this, [saveData]);

        if (row.class && row.class !== '') {
          $this.find('.sc_data .timeline').eq(id).addClass(row.class);
          $this.find('.sc_main .timeline').eq(id).addClass(row.class);
        }
        
        // スケジュールタイムライン
        if (row.schedule) {
          for (var i in row.schedule) {
            var bdata = row.schedule[i];
            var s = bdata.start ? bdata.start : methods.calcStringTime(bdata.startTime);  // 時刻が空文字なら全体の開始時刻
            var e = bdata.end ? bdata.end : methods.calcStringTime(bdata.endTime);
            var data = {};
            data.start = s;
            data.end = e;

            if (bdata.text) {
              data.text = bdata.text;
            }

            data.timeline = timeline;
            data.data = {};

            if (bdata.data) {
              data.data = bdata.data;
            }

            methods._addScheduleData.apply($this, [id, data]);
          }
        }
        // 高さの調整
        methods._resetBarPosition.apply($this, [id]);

        // ガントチャート上にボックスを置いたときの処理
        $this.find('.sc_main .timeline').eq(id).droppable({
          accept: '.sc_bar',
          drop: function drop(ev, ui) {
            var node = ui.draggable;
            var scKey = node.data('sc_key');
            var nowTimelineNum = saveData.schedule[scKey].timeline;
            var timelineNum = $this.find('.sc_main .timeline').index(this);
            
            // タイムラインの変更
            saveData.schedule[scKey].timeline = timelineNum;
            node.appendTo(this);
            
            // 高さ調整
            methods._resetBarPosition.apply($this, [nowTimelineNum]);
            methods._resetBarPosition.apply($this, [timelineNum]);
            console.log("drop", id);
          }
        });
        
        // コールバックがセットされていたら呼出
        if (setting.onAppendRow) {
          $this.find('.sc_main .timeline').eq(id).find('.sc_bar').each(function () {
            var $n = $(this);
            var scKey = $n.data('sc_key');
            setting.onAppendRow.apply($this, [$n, saveData.schedule[scKey]]);
          });
        }
      });
    },

    /**
     * テキストの変更
     *
     * @param {jQuery} node
     * @param {Object} data
     */
    _rewriteBarText: function _rewriteBarText(node, data) {
      return this.each(function () {
        var $this = $(this);

        var setting = methods._loadSettingData.apply($this);

        var saveData = methods._loadData.apply($this);

        var x = node.position().left; // var w = node.width();

        var start = saveData.tableStartTime + Math.floor(x / setting.widthTimeX) * setting.widthTime; // var end = saveData.tableStartTime + (Math.floor((x + w) / setting.widthTimeX) * setting.widthTime);

        var end = start + (data.endTime - data.startTime);
        var html = methods.formatTime(start) + '-' + methods.formatTime(end);
        $(node).find('.time').html(html);
      });
    },

    /**
     * ガントチャートの座標を再設定（重複するなら段数増やすなど）
     * 
     * @param {Number} n - 行id（0始まりインデックス. -1ならガントチャート置き場）
     */
    _resetBarPosition: function _resetBarPosition(n) {
      return this.each(function () {
        var $this = $(this);  // div#schedule

        var setting = methods._loadSettingData.apply($this); // 要素の並び替え
        
        // ボックスを時刻軸に置いたときの処理
        if (n != -1) {
          // n番目の行にあるボックスリスト
          var $barList = $this.find('.sc_main .timeline').eq(n).find('.sc_bar');
          var codes = [],
              check = [];  // check[h][j]; h段目の中でj番目のボックスid（codes=init時につけたid）
          var h = 0;
          var $e1, $e2;
          var c1, c2, s1, s2, e1, e2;
          var i;

          for (i = 0; i < $barList.length; i++) {
            codes[i] = {
              code: i,
              x: $($barList[i]).position().left
            };
          }

          // 時刻が早い順にソート
          codes.sort(function (a, b) {
            if (a.x < b.x) {
              return -1;
            }
            if (a.x > b.x) {
              return 1;
            }
            return 0;
          });

          // 開始時刻が早いボックスからループ
          for (i = 0; i < codes.length; i++) {
            c1 = codes[i].code;  // init時につけられたボックスid
            $e1 = $($barList[c1]);
            
            // h=0段目から順にボックス間が重複しない段数hを探す
            for (h = 0; h < check.length; h++) {
              var next = false;  // 時刻が重複する場合true

              // h段目に既に配置されているボックスjに対しループ
              for (var j = 0; j < check[h].length; j++) {
                c2 = check[h][j];
                $e2 = $($barList[c2]);
                s1 = $e1.position().left;
                e1 = $e1.position().left + $e1.outerWidth();
                s2 = $e2.position().left;
                e2 = $e2.position().left + $e2.outerWidth();

                if (s1 < e2 && e1 > s2) {
                  next = true;
                  continue;
                }
              }

              if (!next) {
                break;
              }
            }

            // h段目にボックスが存在しなければ追加
            if (!check[h]) {
              check[h] = [];
            }

            // このボックスの高さを設定（各行の上端を0とした座標）
            $e1.css({
              top: h * setting.timeLineY + setting.timeLinePaddingTop
            });
            
            // h段目の中でj番目のボックスidを格納
            check[h][check[h].length] = c1;
          }

          // 高さの調整
          methods._resizeRow.apply($this, [n, check.length]);
        
        // ガントチャート置き場に置いたときの処理
        } else {
          // // このボックスの高さを設定
          // $e1.css({
          //   top: h * setting.timeLineY + setting.timeLinePaddingTop
          // });
        }
      });
    },

    /**
     *
     * ある行の高さを調整する
     * 
     * @param n
     * @param height
     */
    _resizeRow: function _resizeRow(n, height) {
      return this.each(function () {
        var $this = $(this);

        var setting = methods._loadSettingData.apply($this);

        var h = Math.max(height, 1);
        $this.find('.sc_data .timeline').eq(n).outerHeight(h * setting.timeLineY + setting.timeLineBorder + setting.timeLinePaddingTop + setting.timeLinePaddingBottom);
        $this.find('.sc_main .timeline').eq(n).outerHeight(h * setting.timeLineY + setting.timeLineBorder + setting.timeLinePaddingTop + setting.timeLinePaddingBottom);
        $this.find('.sc_main .timeline').eq(n).find('.sc_bgBar').each(function () {
          $(this).outerHeight($(this).closest('.timeline').outerHeight());
        });
        $this.find('.sc_data').outerHeight($this.find('.sc_main_box').outerHeight());
      });
    },

    /**
     * resizeWindow：ガントチャート表示部の幅を調整
     */
    _resizeWindow: function _resizeWindow() {
      return this.each(function () {
        var $this = $(this);

        var setting = methods._loadSettingData.apply($this);

        var saveData = methods._loadData.apply($this);

        var scWidth = $this.width();
        var scMainWidth = scWidth - setting.dataWidth - setting.verticalScrollbar;  // ガントチャート表示部の幅
        var cellNum = Math.floor((saveData.tableEndTime - saveData.tableStartTime) / setting.widthTime);
        $this.find('.sc_header_cell').width(setting.dataWidth);
        $this.find('.sc_data,.sc_data_scroll').width(setting.dataWidth);
        $this.find('.sc_header').width(scMainWidth);
        $this.find('.sc_main_box').width(scMainWidth);
        $this.find('.sc_header_scroll').width(setting.widthTimeX * cellNum);
        $this.find('.sc_main_scroll').width(setting.widthTimeX * cellNum);
      });
    },

    /**
     * ガントチャート置き場の幅を調整
     */
    _resizeStrageWindow: function _resizeStrageWindow(){
      return this.each(function(){
        var $this = $(this);
        var setting = methods._loadSettingData.apply($this);
        var scWidth = $this.width();
        var scMainWidth = scWidth - setting.dataWidth - setting.verticalScrollbar - 15;  // ガントチャート表示部の幅
        $this.find('.box_storage').width(scMainWidth);
      });
    },

    /**
     * move all cells of the right of the specified time line cell
     *
     * @param timeline
     * @param baseTimeLineCell
     * @param moveWidth
     */
    _moveSchedules: function _moveSchedules(timeline, baseTimeLineCell, moveWidth) {
      return this.each(function () {
        var $this = $(this);

        var setting = methods._loadSettingData.apply($this);

        var saveData = methods._loadData.apply($this);

        var $barList = $this.find('.sc_main .timeline').eq(timeline).find('.sc_bar');

        for (var i = 0; i < $barList.length; i++) {
          var $bar = $($barList[i]);

          if (baseTimeLineCell.position().left <= $bar.position().left) {
            var v1 = $bar.position().left + setting.widthTimeX * moveWidth;
            var v2 = Math.floor((saveData.tableEndTime - saveData.tableStartTime) / setting.widthTime) * setting.widthTimeX - $bar.outerWidth();
            $bar.css({
              left: Math.max(0, Math.min(v1, v2))
            });
            var scKey = $bar.data('sc_key');
            var start = saveData.tableStartTime + Math.floor($bar.position().left / setting.widthTimeX) * setting.widthTime;
            var end = start + (saveData.schedule[scKey].end - saveData.schedule[scKey].start);
            saveData.schedule[scKey].start = methods.formatTime(start);
            saveData.schedule[scKey].end = methods.formatTime(end);
            saveData.schedule[scKey].startTime = start;
            saveData.schedule[scKey].endTime = end;

            methods._rewriteBarText.apply($this, [$bar, saveData.schedule[scKey]]); // if setting


            if (setting.onChange) {
              setting.onChange.apply($this, [$bar, saveData.schedule[scKey]]);
            }
          }
        }

        methods._resetBarPosition.apply($this, [timeline]);
      });
    },

    /**
     * initialize
     */
    init: function init(options) {
      return this.each(function () {
        var $this = $(this);
        var config = $.extend({
          className: 'jq-schedule',
          rows: {},
          startTime: '07:00',
          endTime: '19:30',
          widthTimeX: 25,  // 時刻軸の幅
          // 1cell辺りの幅(px)
          widthTime: 600,
          // 区切り時間(秒)
          timeLineY: 50,
          // timeline height(px)
          timeLineBorder: 1,
          // timeline height border
          timeBorder: 1,
          // border width
          timeLinePaddingTop: 0,
          timeLinePaddingBottom: 0,
          headTimeBorder: 1,
          // time border width：行名の横幅
          dataWidth: 160,
          // data width
          verticalScrollbar: 0,
          // vertical scrollbar width
          bundleMoveWidth: 1,
          // Y
          dispScheduleY: 500,
          boxStrageY: 100,
          // width to move all schedules to the right of the clicked time cell
          draggable: true,
          resizable: true,
          resizableLeft: false,
          // event
          onInitRow: null,
          onChange: null,
          onClick: null,
          onAppendRow: null,
          onAppendSchedule: null,
          onScheduleClick: null
        }, options);

        // rowsが0始まり連番かチェック
        var l_max = Object.keys(config.rows).length;
        for (var l = 0; l < l_max; l++) {
          if (!(l in config.rows)) {
            throw new Error("rowsのキーが0始まり連番でない");
          }
        }

        methods._saveSettingData.apply($this, [config]);

        var tableStartTime = methods.calcStringTime(config.startTime);
        var tableEndTime = methods.calcStringTime(config.endTime);
        tableStartTime -= tableStartTime % config.widthTime;
        tableEndTime -= tableEndTime % config.widthTime;

        methods._saveData.apply($this, [{
          tableStartTime: tableStartTime,
          tableEndTime: tableEndTime
        }]);

        var html = '' +
          '<div class="sc_menu">' + '\n' +  // 時刻を表示する行
            '<div class="sc_header_cell"><span>&nbsp;</span></div>' + '\n' +  // 左上の空白セル
            '<div class="sc_header">' + '\n' +
              '<div class="sc_header_scroll"></div>' + '\n' +  // 時刻
            '</div>' + '\n' +
          '</div>' + '\n' +
          '<div class="sc_wrapper">' + '\n' +  // 行名とガントチャートを表示する要素
            '<div class="sc_data">' + '\n' +  // 行名
              '<div class="sc_data_scroll"></div>' + '\n' +  // 行名記載セル
            '</div>' + '\n' +
            '<div class="sc_main_box">' + '\n' +  // ガントチャート（スクロールバー含む）
              '<div class="sc_main_scroll">' + '\n' +  // ガントチャート（スクロールバー以外）
                '<div class="sc_main"></div>' + '\n' +
              '</div>' + '\n' +
            '</div>' + '\n' +
          '</div>';
        
        $this.append(html);   // $this==$("#schedule")
        $this.addClass(config.className);
        // ガントチャート表示部の高さ設定
        $this.find('.jq-schedule .sc_data,.sc_main_box').css('maxHeight', config.dispScheduleY);
        // 作業者名、時刻ラベルのスクロール設定
        $this.find('.sc_main_box').on('scroll', function () {
          $this.find('.sc_data_scroll').css('top', $(this).scrollTop() * -1);
          $this.find('.sc_header_scroll').css('left', $(this).scrollLeft() * -1);
        });

        var beforeTime = -1;

        // <sc_time>（時刻が記載されている各マス）を<sc_header_scroll>の子要素へ追加
        for (var t = tableStartTime; t < tableEndTime; t += config.widthTime) {
          if (beforeTime < 0 || Math.floor(beforeTime / 3600) !== Math.floor(t / 3600)) {
            html = '';
            html += '<div class="sc_time">' + methods.formatTime(t) + '</div>';
            var $time = $(html);
            var cn = Number(Math.min(Math.ceil((t + config.widthTime) / 3600) * 3600, tableEndTime) - t);
            var cellNum = Math.floor(cn / config.widthTime);
            $time.width(cellNum * config.widthTimeX);
            $this.find('.sc_header_scroll').append($time);
            beforeTime = t;
          }
        }

        // ガントチャート表示部の幅を調整
        $(window).on('resize', function () {
          methods._resizeWindow.apply($this);
        }).trigger('resize'); // addrow

        // 各行の描画（行ごとにボックス作成）
        for (var i in config.rows) {
          // objectのkeyはJSの仕様でstringになるため、intに変換
          i = parseInt(i, 10);
          methods._addRow.apply($this, [i, config.rows[i]]);
        }

        // ガントチャート置き場
        $(".sc_main_box").wrap($('<div class="sc_draggable_wrapper"></div>'));  // 親要素追加
        var $box_storage = $('<div class="box_storage"></div>');
        $(".sc_draggable_wrapper").append($box_storage);  // ガントチャート置き場追加
        // ガントチャート置き場の高さ設定
        var $storage = $this.find('.box_storage');
        $storage.css({
          top: config.dispScheduleY,
          height: config.boxStrageY,
        });
        // ガントチャート置き場の幅を調整
        $(window).on('resize', function(){
          methods._resizeStrageWindow.apply($this);
        }).trigger('resize');
        
        // ガントチャート置き場にボックスを置いたときの処理
        var saveData = methods._loadData.apply($this);
        $this.find('.box_storage').droppable({
          accept: '.sc_bar',
          drop: function drop(ev, ui) {
            var node = ui.draggable;
            var scKey = node.data('sc_key');
            var nowTimelineNum = saveData.schedule[scKey].timeline;
            var timelineNum = -1
            
            // ボックスのタイムライン、時刻等の変更
            saveData.schedule[scKey].timeline = -1;  // どこに反映される？
            node.appendTo(this);

            // 高さ調整
            methods._resetBarPosition.apply($this, [nowTimelineNum]);
            methods._resetBarPosition.apply($this, [timelineNum]);
            console.log("drop", -1);

            return false;
          }
        });
      });
    }
  };
  /**
   *
   * @param {Object|string} method
   * @returns {jQuery|methods|*}
   */
  // eslint-disable-next-line no-param-reassign

  $.fn.timeSchedule = function (method) {
    // ※this=[div#schedule]
    // Method calling logic
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); // eslint-disable-next-line no-else-return
    } else if (_typeof(method) === 'object' || !method) {
      return methods.init.apply(this, arguments);
    }

    $.error('Method ' + method + ' does not exist on jQuery.timeSchedule');
    return this;
  };
})(jQuery);