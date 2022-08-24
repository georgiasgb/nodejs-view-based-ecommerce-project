const getNotFound404 = (req, res, next) => {
    res.status(404).render('404_pageNotFound', {docTitle: 'Page Not Found', path: '/404', isLoggedIn: req.session.isLoggedIn})
}

const getError500 = (req, res, next) => {
    res.status(500).render('500_errorPage', {docTitle: 'Error Page', path: '/500', isLoggedIn: req.session.isLoggedIn})
}

module.exports = {getNotFound404, getError500}