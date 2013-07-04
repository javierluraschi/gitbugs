GitBugs
=======

**GitBugs** is a library to help teams understand their GitHub bugs: [http://www.gitbugs.com](http://www.gitbugs.com)

Use GitBugs.download(user, repo, status) to download bugs for a given repositiory. "status" can take the values "open" or "close". Try the following example to get started:

```
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <script type="text/javascript" src="http://www.gitbugs.com/gitbugs.js"></script>
  </head>
  <body>
    <a href="#" onclick="GitBugs.download('twitter', 'bootstrap', 'open')">
      Download Bootstrap Bugs
    </a>
  </body>
</html>
```

License
=======

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
