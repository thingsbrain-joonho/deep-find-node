const express = require('express');
const router = express.Router();
const fs = require('fs');
const cleanhouseFolder = '/var/www/html/cleanhouse_beta/log';
const smartparkingFolder = '/var/www/html/test-smart-parking/log';
const logFolder = '/var/www/html/deep-find.com/log';

const session = require('express-session');
const userdb = require('../public/js/user.js');
const async = require('async');
// const swal = require('sweetalert2');
var recentFile;

const logger = require('../public/js/logger.js');

/* GET: 로그인 페이지 */
router.get('/login', function(req, res) {
  res.render('location/login', {
    user_id: undefined,
  });
});

/* POST: 로그인 페이지 */
router.post('/login', function(req, res) {
  var sess = req.session;
  var id = req.body.id;
  var pw = req.body.pw;
  // console.log("id: " + id + " / pw: " + pw);

  userdb.query("select * from PK_USER where user_id=? and user_pw=?", [id, pw],
    function(err, rows, fields) {
      if (err || rows.length == 0) {
        res.redirect('/login');
      } else {
        var info = rows[0];
        if (id == info['user_id'] & pw == info['user_pw']) {
          sess.user_id = id;
          res.redirect('location/');
        }
      }
    });
});

/* GET: 로그아웃 페이지 */
router.get('/logout', function(req, res) {
  var sess = req.session;
  if (sess.user_id) {
    req.session.destroy(function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect('location/login');
      }
    })
  } else {
    res.redirect('location/login');
  }
});

/* GET: 메인 페이지 */
router.get('/', (req, res) => {
  var sess = req.session;
  // console.log("get: " + sess.user_id);

  if (!sess.user_id) {
    res.redirect('location/login');
  } else {
    saveLogger(req, sess.user_id, 'main', 'GET', '메인화면 접속');
    res.render('location/index', {
      user_id: sess.user_id,
    });
  }
});

/* GET: 클린하우스 로그 페이지 */
router.get('/cleanhouse', (req, res) => {
  var sess = req.session;

  if (!sess.user_id) {
    res.redirect('location/login');
  } else {
    saveLogger(req, sess.user_id, 'cleanhouse', 'GET', '클린하우스 로그 접속');
    readFile(cleanhouseFolder, sess.user_id, res);
  }
});

/* POST: 클린하우스 로그 페이지 */
router.post('/cleanhouse', function(req, res) {
  var sess = req.session;
  var postdata = req.body.data;
  postFile(cleanhouseFolder, postdata, sess.user_id, req, res);
});

/* GET: 스마트주차 로그 페이지 */
router.get('/smart', (req, res) => {
  var sess = req.session;

  if (!sess.user_id) {
    res.redirect('location/login');
  } else {
    saveLogger(req, sess.user_id, 'smart', 'GET', '스마트파킹 로그 접속');
    readFile(smartparkingFolder, sess.user_id, res);
  }
});

/* POST: 스마트주차 로그 페이지 */
router.post('/smart', function(req, res) {
  var sess = req.session;
  var postdata = req.body.data;
  postFile(smartparkingFolder, postdata, sess.user_id, req, res);
});

/* GET: 유해조수 로그 페이지 */
router.get('/animal', (req, res) => {
  var sess = req.session;
  // console.log("get: " + sess.user_id);

  if (!sess.user_id) {
    res.redirect('location/login');
  } else {
    saveLogger(req, sess.user_id, 'animal', 'GET', '유해조수 로그 접속');
    res.render('location/animal', {
      user_id: sess.user_id,
    });
  }
});

/* GET: 통합정보시스템 로그 페이지 */
router.get('/log', (req, res) => {
  var sess = req.session;

  if (!sess.user_id) {
    res.redirect('location/login');
  } else {
    saveLogger(req, sess.user_id, 'log', 'GET', '통합관리시스템 로그 접속');
    readFile(logFolder, sess.user_id, res);
  }
});

/* POST: 종합정보시스템 로그 페이지 */
router.post('/log', function(req, res) {
  var sess = req.session;
  var postdata = req.body.data;
  postFile(logFolder, postdata, sess.user_id, req, res);
});

// 타겟폴더에서 로그 읽어오기
function readFile(targetfolder, uid, res) {
  var targetrender;
  if (targetfolder == cleanhouseFolder) {
    targetrender = 'cleanhouse';
  } else if (targetfolder == smartparkingFolder) {
    targetrender = 'smart';
  } else if (targetfolder == logFolder) {
    targetrender = 'log';
  }
  // 모든 파일리스트를 담을 배열
  var files = [];
  // 가장 최신파일의 로그 리스트를 담을 배열
  var logs = [];
  // 타겟폴더를 읽는다
  fs.readdir(targetfolder, function(err, filelist) {
    if (err) {
      console.log(err);
      throw err;
    }
    // 로그 파일들을 files 배열에 담는다
    filelist.forEach(function(file) {
      files.push(file);
    });
    // 가장 최신파일을 할당하고
    recentFile = files[files.length - 1];
    // 최신 파일의 로그기록을 읽어온다
    fs.readFile(targetfolder + '/' + recentFile, 'utf-8', function(err, data) {
      if (err) {
        console.log(err);
        throw err;
      }
      // 한 줄에 하나의 로그가 있으므로 줄바꿈을 통해 로그들을 담는다
      array = data.toString().split("\n");
      for (i in array) {
        logs.push(array[i]);
      }
      res.render(targetrender, {
        user_id: uid,
        logs: logs,
      });
    });
  });
}

// post 형식의 로그 읽기
function postFile(targetfolder, postdata, uid, req, res) {
  var target;
  if(targetfolder == cleanhouseFolder){
    target = 'cleanhouse';
  }else if(targetfolder == smartparkingFolder){
    target = 'smart';
  }else if(targetfolder == logFolder){
    target = 'log';
  }
  var result = [];
  // 선택한 날짜의 로그파일 선택
  var path = targetfolder + '/system.log.' + postdata;
  fs.access(path, fs.F_OK, (err) => {
    if (err) {
      // 해당 날짜에 로그파일이 없다면 에러 리턴
      return res.status(400).send({
        message: 'no file exists!',
      });
    }
    // 로그파일이 있다면 읽어온다
    fs.readFile(path, function(err, data) {
      if (err) throw err;
      saveLogger(req, uid, target, 'POST', postdata + '일 로그 조회');
      array = data.toString().split("\n");
      for (i in array) {
        result.push(array[i]);
      }
      res.json({
        result: result,
      });
    });
  });
}

// 로그를 찍는 함수
function saveLogger(req, id, path, type, detail) {
  // 로그 파일에 로그인 IP와 사용자 정보 저장하기
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  logger.info("," + path + "," + type + "," + id + "," + ip + "," + detail);
}

module.exports = router;
