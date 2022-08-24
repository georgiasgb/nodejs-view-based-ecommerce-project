const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const MONGODB_URL = 'MONGODB STRING CONNECTION without ?retryWrites=true&w=majority';
const store = new mongodbStore({
    uri: MONGODB_URL,
    collection: 'sessions', 
});
const csrfProtection = csrf();

const User = require('./models/user_model');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const errorsController = require('./controllers/errorPages_controller');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, Math.floor(Math.random() * 16777215).toString(16) + '-' + file.originalname);
    }
});

const fileTypes = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false)
    }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({extended: false})); 
app.use(multer({storage: fileStorage, fileFilter: fileTypes}).single('pImage'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({
    secret:'asdfghjklç',
    resave: false,
    saveUninitialized: false, 
    store: store
    })
);
app.use(csrfProtection);
app.use(flash()); 

app.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
    .then(user => {
        if(!user) {
            return next();
        }
        req.user = user;
        next();
    }).catch(err => {
        next(new Error(err));
    })
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorsController.getNotFound404); 
app.get('/500', errorsController.getError500)

app.use((error, req, res, next) => {
    let message = error.message;
    if(!message){
        message = null;
    }
    res.status(500).render('500_errorPage', {
        docTitle: 'Error Page', path: '/500', isLoggedIn: req.session.isLoggedIn, errorMessage: message
    }); 
});

mongoose.connect(MONGODB_URL + '?retryWrites=true&w=majority')
.then(() => {
    app.listen(3000)
}).catch(err => console.log(err));