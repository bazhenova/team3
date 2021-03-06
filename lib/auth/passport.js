'use strict';

const async = require('async');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const VKStrategy = require('passport-vkontakte').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const requestToDB = require('./requestToDB');
const config = require('./config');

module.exports = passport => {
    passport.serializeUser((user, done) => {
        done(null, user._id.$oid);
    });

    passport.deserializeUser((id, done) => {
        var query = {_id: {$oid: id}};
        requestToDB
            .findUser(JSON.stringify(query))
            .then(result => {
                done(null, result.user._id.$oid);
            })
            .catch(err => {
                done(err);
            });
    });

    passport.use('local-login', new LocalStrategy({
        usernameField: 'login',
        passwordField: 'password',
        passReqToCallback: true
    }, (req, login, password, done) => {
        requestToDB
            .checkPassword(login, password)
            .then(response => {
                response.message.length ?
                    done(null, false, req.flash('loginMessage', response.message)) :
                    done(null, response.user);
            })
            .catch(err => {
                done(err);
            });
    }));

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'login',
        passwordField: 'password',
        passReqToCallback: true
    }, (req, login, password, done) => {
        requestToDB
            .addUser({login: login, password: password})
            .then(response => {
                response.message.length ?
                    done(null, false, req.flash('signupMessage', response.message)) :
                    done(null, response.user);
            })
            .catch(err => {
                done(err);
            });
    }));

    passport.use('facebook', new FacebookStrategy({
        clientID: config.facebookAuth.clientID,
        clientSecret: config.facebookAuth.clientSecret,
        callbackURL: config.facebookAuth.callbackURL
    },
    (token, refreshToken, profile, next) => {
        var query = "{ 'facebook.id' :'" + profile.id + "'}";
        var user = {
            facebook: {
                id: profile.id,
                token: token
            },
            nickname: profile.displayName,
            gender: profile.gender
        };
        socialAuthenticate(query, user, next);
    }));

    passport.use('vkontakte', new VKStrategy({
        clientID: config.vkAuth.clientID,
        clientSecret: config.vkAuth.clientSecret,
        callbackURL: config.vkAuth.callbackURL
    }, (accessToken, refreshToken, profile, next) => {
        var query = "{ 'vk.id' :'" + profile.id + "'}";
        var user = {
            vk: {
                id: profile.id.toString(),
                token: accessToken
            },
            nickname: profile.displayName,
            gender: profile.gender
        };
        socialAuthenticate(query, user, next);
    }));

    passport.use('twitter', new TwitterStrategy({
        consumerKey: config.twitterAuth.consumerKey,
        consumerSecret: config.twitterAuth.consumerSecret,
        callbackURL: config.twitterAuth.callbackURL
    },
    (token, tokenSecret, profile, next) => {
        var query = "{ 'twitter.id' :'" + profile.id + "'}";
        var user = {
            twitter: {
                id: profile.id.toString(),
                token: token
            },
            nickname: profile.displayName
        };
        socialAuthenticate(query, user, next);
    }));

    passport.use('google', new GoogleStrategy({
        clientID: config.googleAuth.clientID,
        clientSecret: config.googleAuth.clientSecret,
        callbackURL: config.googleAuth.callbackURL
    },
    (token, refreshToken, profile, next) => {
        var query = "{ 'google.id' :'" + profile.id + "'}";
        var user = {
            google: {
                id: profile.id.toString(),
                token: token
            },
            nickname: profile.displayName
        };
        socialAuthenticate(query, user, next);
    }));
};

function socialAuthenticate(query, user, next) {
    async.waterfall([
        done => {
            requestToDB
                .findUser(query)
                .then(response => {
                    done(null, response);
                })
            .catch(err => {
                done(err);
            });
        },
        (response, done) => {
            if (response.message.length) {
                requestToDB
                    .addSocialUser(user)
                    .then(result => {
                        next(null, result.user);
                    })
                    .catch(err => {
                        done(err);
                    });
            } else {
                next(null, response.user);
            }
        }
    ], err => {
        console.error(err);
    });
}
