// # Posts API
// RESTful API for the Post resource
var when            = require('when'),
    _               = require('lodash'),
    canThis         = require('../permissions').canThis,
    dataProvider    = require('../models'),
    errors          = require('../errors'),

    roles;

/**
 * ## Roles API Methods
 *
 * **See:** [API Methods](index.js.html#api%20methods)
 */
roles = {
    /**
     * ### Browse
     * Find all roles
     *
     * Will return all roles that the current user is able to assign
     *
     *
     * @public
     * @param {{context, page, limit, status, staticPages, tag}} options (optional)
     * @returns {Promise(Roles)} Roles Collection
     */
    browse: function browse(options) {
        var permissionMap = [];
        options = options || {};

        return canThis(options.context).browse.role().then(function () {
            return dataProvider.Role.findAll(options).then(function (foundRoles) {
                if (options.permissions === 'assign') {
                    // Hacky implementation of filtering because when.filter is only available in when 3.4.0,
                    // but that's buggy and kills other tests and introduces Heisenbugs. Until we turn everything
                    // to Bluebird, this works. Sorry.
                    // TODO: replace with better filter when bluebird lands
                    _.each(foundRoles.toJSON(), function (role) {
                        permissionMap.push(canThis(options.context).assign.role(role).then(function () {
                            return role;
                        }, function () {
                            return null;
                        }));
                    });

                    return when.all(permissionMap).then(function (resolved) {
                        return { roles: _.filter(resolved, function (role) {
                            return role !== null;
                        }) };
                    }).catch(errors.logAndThrowError);
                }
                return { roles: foundRoles.toJSON() };
            });
        })
        .catch(errors.logAndThrowError);
    }
};

module.exports = roles;
