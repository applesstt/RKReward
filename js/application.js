
var lucky = (function (){

  this.speed = 50;
  this.intervalID;

  var db = openDatabase("lucky", "1.0", "lucky draw", 1000);

  this.initDB = function() {
    db.transaction(function(tx) {
      tx.executeSql("CREATE TABLE IF NOT EXISTS names (id INTEGER PRIMARY KEY ASC, name TEXT unique, status INTEGER)");
    });
  }

  this.clearDB = function(){
    db.transaction(function(tx) {
      tx.executeSql("DROP TABLE names", [], function(tx, results){
        alert("Clear data success!");
        this.initDB();
      });
    });
  }

  this.import_data = function(tickets) {
    db.transaction(function (tx) {
      for (i=0; i< tickets.length; i++)
        tx.executeSql('INSERT INTO names (name, status) VALUES (?, 0)', [ tickets[i] ]);
    });
  }

  this.showAllTickets = function(){
    db.transaction(function (tx) {
      tx.executeSql('SELECT * FROM names', [], function (tx, results) {
        var len = results.rows.length, i, ticket;
        $('#tickets').empty();
        for (i = 0; i < len; i++){
          ticket = results.rows.item(i);
          $('#tickets').append('<tr><td>'+ticket.name+'</td><td>'+ticket.status+'</td></tr>');
        }
      });
    });
  }

  this.showLuckyNames = function(){
    db.transaction(function (tx) {
      tx.executeSql('SELECT * FROM names WHERE status = 1', [], function (tx, results) {
        var len = results.rows.length, i;
        $('#lucky-names').empty();
        for (i = 0; i < len; i++)
          $('#lucky-names').append('<li>'+results.rows.item(i).name+'</li>');
      });
    });
  }

  this.getFiveRandom = function(len) {
    if(len <= 0) return [];
    var randomAry = [];
    while(randomAry.length < (len > 5 ? 5 : len)) {
      var num = rand(len);
      var isSame = false;
      for(var i = 0, nLen = randomAry.length; i < nLen; i++) {
        if(randomAry[i] === num) {
          isSame = true;
          break;
        }
      }
      if(!isSame) randomAry.push(num);
    }
    return randomAry;
  }

  this.rolling = function(){
    db.transaction(function(tx) {
      tx.executeSql('SELECT * FROM names WHERE status = 0', [], function (tx, results) {
        var randomAry = getFiveRandom(results.rows.length);
        var nameAry = [];
        for(var i = 0, len = randomAry.length; i < len; i++) {
          nameAry.push(results.rows.item(randomAry[i] - 1).name);
        }
        $('#random').text(nameAry.join(' '));
      });
    });
  }

  this.startRolling = function(){
    this.intervalID = setInterval(this.rolling, this.speed);
  }

  this.stopRolling = function(){
    clearInterval(this.intervalID);

    db.transaction(function(tx) {
      var names = $('#random').text().split(' ');
      for(var i = 0, len = names.length; i < len; i++) {
        tx.executeSql("UPDATE names SET status = 1 WHERE name = ?", [names[i]],
          function (tx, results) {
            this.showLuckyNames();
            this.showAllTickets();
          }
        );
      }

    });
  };

  return this;
})();

$(function(){

  $('#lucky-draw').height(Math.max($(window).height(), $('#lucky-draw').height()));

  lucky.initDB();
  lucky.showLuckyNames();
  lucky.showAllTickets();

  //点击body时，隐藏日期控件
  $('body').bind('keydown', function(e){
    var k = e.which || e.keyCode;
    if(k == 32){
      $('#lucky-button').click();
      return false;
    }
  });

  $('body').delegate('#import-button', 'click', function(event){
    var list_str = $('#data-source').val();
    var names = [];
    var list_lines = list_str.split("\n");
    for (var i = 0; i < list_lines.length; i++) {
      var name = $.trim(list_lines[i]);
      if (name != "") names.push(name);
    }
    lucky.import_data(names);
    lucky.showAllTickets();
  });

  $('body').delegate('#clear-data-button', 'click', function(event){
    lucky.clearDB();
    lucky.showLuckyNames();
    lucky.showAllTickets();
  });

  $('#lucky-button').toggle(
    function(){
      $(this).val('停 止');
      lucky.startRolling();
    },
    function(){
      $(this).val('开 始');
      lucky.stopRolling();
    }
  );

});


