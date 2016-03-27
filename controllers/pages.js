const fs = require('fs');
var handlebars = require('handlebars');
var layouts = require('handlebars-layouts');
handlebars.registerHelper(layouts(handlebars));
handlebars.registerPartial('base', fs.readFileSync('./views/base.hbs', 'utf8'));

exports.index = (req, res) => {
    var template = handlebars.compile(fs.readFileSync('./views/main/main.hbs', 'utf8'));
    res.send(template(Object.assign({
        title: 'Layout Test',
        items: [
            'apple',
            'orange',
            'banana'
        ]
    }, req.commonData)));
};

const _ = require('lodash');
exports.index = (req, res) => {
    res.render('main/main', Object.assign({
        message: `Hello, ${_.get(req, 'user.login', 'User')}!`
    }, req.commonData));
};

exports.error404 = (req, res) => {
    res.sendStatus(404);
};
