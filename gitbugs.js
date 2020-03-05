var UTIL = (function (my) {
    my.foreach = function (data, callback) {
        for (var idxElement = 0; idxElement < data.length; idxElement++) {
            callback(idxElement, data[idxElement]);
        }
    };

    my.parallel = function (actions, finished) {
        finishedCount = 0;
        var results = [];

        UTIL.foreach(actions, function (i, action) {
            action.action(function (result) {
                results[i] = result;
                finishedCount++;

                if (finishedCount == actions.length) {
                    finished(results);
                }
            }, action.data);
        });
    };

    my.saveFile = function (type, data, fileName) {
        var uri = 'data:' + type + ';charset=utf-8,' + encodeURIComponent(data);

        var downloadLink = document.createElement("a");
        downloadLink.href = uri;
        downloadLink.download = fileName;

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    my.createCORSRequest = function (method, url) {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") {
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else {
            xhr = null;
        }

        return xhr;
    };

    my.requestData = function (url, success, error) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.open("GET", url, true);

        httpRequest.onload = function () {
            var headers = {};
            var headersRaw = httpRequest.getAllResponseHeaders().toLowerCase();
            headersRaw = headersRaw.split(/\r?\n/);
            UTIL.foreach(headersRaw, function (index, headerRaw) {
                var headerParts = headerRaw.split(":");
                var haderName = headerParts[0];
                headerParts.splice(1, 0);

                headers[haderName] = headerParts.join(":");
            });

            success(JSON.parse(httpRequest.responseText), headers);
        }

        httpRequest.onerror = function () {
            error(JSON.parse(httpRequest.responseText));
        }

        httpRequest.withCredentials = false;
        httpRequest.send();
    };

    return my;
}(UTIL || {}));

var GitBugs = (function (my) {
    var csvFields = {
        "url": true,
        "labels_url": true,
        "comments_url": true,
        "events_url": true,
        "html_url": true,
        "id": true,
        "number": true,
        "title": true,
        "state": true,
        "assignee": {
            "login": true,
            "id": true,
            "avatar_url": true,
            "gravatar_id": true,
            "url": true
        },
        "comments": true,
        "created_at": true,
        "updated_at": true,
        "closed_at": true,
        "milestone": {
            "url": true,
            "number": true,
            "state": true,
            "title": true
        },
        "user": {
            "login": true,
            "id": true,
            "avatar_url": true,
            "gravatar_id": true,
            "url": true,
            "html_url": true,
            "followers_url": true,
            "following_url": true,
            "gists_url": true,
            "starred_url": true,
            "subscriptions_url": true,
            "organizations_url": true,
            "repos_url": true,
            "events_url": true,
            "received_events_url": true,
            "type": true
        },
        "pull_request": {
            "html_url": true,
            "diff_url": true,
            "patch_url": true
        },
        "labels": [
            {
                "url": true,
                "name": true,
                "color": true
            }
        ],
        "body": true,
    };

    var processHeader = function (fields, prefix) {
        var line = '';

        for (var field in fields) {
            if (Array.isArray(fields[field])) {
                for (var idxArray = 0; idxArray < 5; idxArray++) {
                    line += processHeader(fields[field][0], prefix + field + "_" + idxArray + "_");
                }
            }
            else if (typeof (fields[field]) === "object") {
                line += processHeader(fields[field], prefix + field + "_");
            }
            else {
                line += prefix + field + ",";
            }
        }

        return line;
    }

    var processDataObject = function (fields, object) {
        var line = '';

        for (var field in fields) {
            var value = object === null || typeof (object) === "undefined" ? "" : object[field];

            if (Array.isArray(fields[field])) {
                for (var idxArray = 0; idxArray < 5; idxArray++) {
                    var arrayValue = !value || idxArray >= value.length ? null : value[idxArray];
                    line += processDataObject(fields[field][0], arrayValue);
                }
            }
            else if (typeof (fields[field]) === "object") {
                line += processDataObject(fields[field], value);
            }
            else {
                if (object && object.hasOwnProperty(field)) {
                    if (typeof (value) === "string") {
                        line += '"' + value.replace(/"/g, '""') + '"';
                    }
                    else {
                        line += value;
                    }
                }
                line += ",";
            }
        }

        return line;
    }

    var processData = function (fields, result) {
        var str = '';

        for (var i = 0; i < result.length; i++) {
            var topObject = result[i];
            var line = processDataObject(fields, topObject);

            line = line.substring(0, line.length - 1);
            str += line + "\n";
        }

        return str;
    }

    my.download = function (user, repo, state) {
        var url = "https://api.github.com/repos/" + user + "/" + repo + "/issues?state=" + state;
        UTIL.requestData(url, function (response, headers) {
            var allActions = [];
            if (headers.link !== undefined) {
                var totalPages = /page=([0-9]+)>; rel=\"last/g.exec(headers.link)[1];

                for (var idxPage = 1; idxPage <= totalPages; idxPage++) {
                    allActions.push({
                        action: function (completed, data) {
                            UTIL.requestData(data, completed);
                        },
                        data: url + "&page=" + idxPage
                    });
                }
            } else {
                allActions.push({
                    action: function (completed, data) {
                        completed(data)
                    },
                    data: response
                })
            }

            UTIL.parallel(allActions, function (results) {
                var csvData = processHeader(csvFields, "");
                csvData = csvData.substring(0, csvData.length - 1) + "\n";
                for (var result in results) {
                    csvData += processData(csvFields, results[result]);
                }

                UTIL.saveFile('text/csv', csvData, repo + ".csv")
            });
        });
    }

    return my;
}(GitBugs || {}));