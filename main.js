// Last Modification : 2021.07.28
// by HYOSITIVE
// based on WEB6 - MultiUserAuth - 8

const port = 3000
var express = require('express')
var app = express()
var fs = require('fs');
var bodyParser = require('body-parser');
var compression = require('compression');
var helmet = require('helmet');
app.use(helmet());
var session = require('express-session');
var FileStore = require('session-file-store')(session); // 실제로는 데이터베이스에 저장하는 것이 바람직함
var flash = require('connect-flash');
var db = require('./lib/db');

app.use(express.static('public')); // public directory 안에서 static file을 찾겠다는 의미. public 폴더 안의 파일은 url을 통해 접근 가능

// 애플리케이션은 요청이 들어올 때마다 bodyparser, compression middleware를 실행

// bodyparser : 전송한 정보를 자동으로 분석해주는 middleware
// app.use()안의 내용은 bodyParser가 만들어내는 middleware를 표현하는 표현식
app.use(bodyParser.urlencoded({ extended: false}));

// compression : 웹 서버에서 정보를 압축해 전송해주는 middleware
// compression()함수가 middleware를 return
app.use(compression());

app.use(session({ // session middleware
  secret: 'keyboard cat', // 타인에게 유출하면 안됨. 실제 구현 시 변수처리하거나 외부에서 지정
  resave: false, // 세션 데이터가 바뀌기 전까지는 세션 저장소에 값을 저장하지 않는다
  saveUninitialized: true, // 세션이 필요하기 전까지는 세션을 구동시키지 않는다
	store:new FileStore()
}))

app.use(flash()); // flash 오류로 skip

var passport = require('./lib/passport')(app) // passport.js 자체가 함수로 기능. 파라미터에 app(express)를 주입. login_process에서 passport를 사용하므로 passport 변수 사용

// my middleware
// middleware의 함수는 request, response, next를 인자로 가짐
app.get('*', function(request, response, next){ // get 방식으로 들어오는 모든 요청에 대해
	request.list = db.get('topics').value(); // topics의 모든 값 로드. 실제 서비스에서는 take를 이용해 일정 숫자 지정해야 함
	next(); // next에는 그 다음에 호출되어야 할 middleware 담김
});

var indexRouter = require('./routes/index');
var topicRouter = require('./routes/topic');
var authRouter = require('./routes/auth')(passport); // auth.js 자체가 함수로 기능. 파라미터에 passport 주입. router로 return

app.use('/', indexRouter);
app.use('/topic', topicRouter); // /topic으로 시작하는 주소들에게 topicRouter라는 middleware를 적용
// 이렇게 사용할 경우, topicRouter middleware에서 'topic' 경로를 다시 알려줄 필요 없음
app.use('/auth', authRouter);

app.use(function(req, res, next) { // 404 에러 처리 middleware
	res.status(404).send('Sorry cant find that!');	
});

app.use(function(err, req, res, next) { // 4개의 인자를 가진 함수는 Express에서 Error Handler middleware로 지정 
	console.error(err.stack);
	res.status(500).send('Something broke!');
})

app.listen(port, function() {console.log(`Example app listening at http://localhost:${port}`)});