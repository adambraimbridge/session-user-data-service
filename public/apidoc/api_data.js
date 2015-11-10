define({ "api": [
  {
    "type": "get",
    "url": "v1/livefyre/get_lf_bootstrap",
    "title": "Get livefyre bootstrap URL",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "get_lf_bootstrap",
    "description": "<p>See <a href=\"http://answers.livefyre.com/developers/advanced-topics/bootstrap-html/\">Livefyre documentation</a></p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "uuid",
            "description": "<p>ID of the article.</p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "url",
            "description": "<p>URL which points to a ready rendered version of the comments widget.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n {\n     \"url\": \"https://bootstrap.ft-1.fyre.co/bs3/ft-1.fyre.co/377197/ZTc4ZDA3Y2EtNjgwZi0xMWU1LWE1N2YtMjFiODhmN2Q5NzNm/bootstrap.html\"\n }",
          "type": "json"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/getcollectiondetails",
    "title": "Get collection details",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "getcollectiondetails",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "articleId",
            "description": "<p>ID of the article.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "url",
            "description": "<p>Url of the article.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "title",
            "description": "<p>Title of the article.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "stream_type",
            "description": "<p>Can be one of 'livecomments', 'liveblog', 'livechat'. Default is 'livecomments'.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "tags",
            "description": "<p>Additional tags for the collection (added to the CAPI and URL based tags). Comma separated.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "sessionId",
            "description": "<p>Session ID of the user. Optional, if not present FTSession is read from the cookies.</p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "<p>Number</p> ",
            "optional": false,
            "field": "siteId",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "articleId",
            "description": "<p>ID of the article, echo of the input parameter.</p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "collectionMeta",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "checksum",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "notAllowedToCreateCollection",
            "description": "<p>Present only if the user is not authenticated and the collection does not exist. In this case this user is not allowed to create the collection.</p> "
          }
        ],
        "unclassified": [
          {
            "group": "unclassified",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "unclassifiedArticle",
            "description": "<p>Relates to the legacy mapping of articles to different sites based on primary section/URL. If the URL was not mapped by the legacy mapping logic, flag it.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Normal success",
          "content": "HTTP/1.1 200 OK\n {\n    \"siteId\": 375297,\n    \"articleId\": \"e78d07ca-680f-11e5-a57f-21b88f7d973f\",\n    \"collectionMeta\": \"eyJ0eXAiOiJKV16134HFOiJIUzI1NiJ9.eyJ0eXBlIjoiSHRGRGRjfg452iJLYXRoZXJpbmUgR2FycmV0dC1Db3ggc3RlcHMgYmFjayBpbiBBbGxpYW5jZSBUcnVzdCBzaGFrZS11cCIsImFydGljbGVJZCI6ImU3OGQwN2NhLTY4MGYtMTFlNS1hNTdmLTIxYjg4ZjdkOTczZiIsInVybCI6Imh0dHA6Ly93d3cuZnQuY29tL2ludGwvY21zL3MvMC9lNzhkMDdjYS02ODBmLTExZTUtYTU3Zi0yMWI4OGY3ZDk3M2YuaHRtbCIsInRhZ3MiOiJzZWN0aW9ucy5Db21wYW5pZXMsc2VjdGlvbnMuRmluYW5jaWFscyxzZWN0aW9ucy5GaW5hbmNpYWxfU2VydmljZXMsc2VjdGlvbnMuVUtfQ29tcGFuaWVzLGF1dGhvcnMuRGF2aWRfT2FrbGV5LGF1dGhvcnMuTmF0aGFsaWVfVGhvbWFzIiwiaXNzIjoidXJuOmxpdmVmeXJlOmZ0LTEuZnlyZS5jbzpzaXRlPTM3NzE5NyIsImlhdCI6MTQ0NzA3OTYwNH0.oW2sCELfPTlj_7JLVzVhhiM86mRpW56uYNDcP4D7Tj8\",\n    \"checksum\": \"974b4240f9ad8423015612809be6990f\"\n }",
          "type": "json"
        },
        {
          "title": "Not authenticated / no collection",
          "content": "HTTP/1.1 200 OK\n {\n    \"siteId\": 375297,\n    \"articleId\": \"e78d07ca-680f-11e5-a57f-21b88f7d973f\",\n    \"collectionMeta\": \"eyJ0eXAiOiJKV16134HFOiJIUzI1NiJ9.eyJ0eXBlIjoiSHRGRGRjfg452iJLYXRoZXJpbmUgR2FycmV0dC1Db3ggc3RlcHMgYmFjayBpbiBBbGxpYW5jZSBUcnVzdCBzaGFrZS11cCIsImFydGljbGVJZCI6ImU3OGQwN2NhLTY4MGYtMTFlNS1hNTdmLTIxYjg4ZjdkOTczZiIsInVybCI6Imh0dHA6Ly93d3cuZnQuY29tL2ludGwvY21zL3MvMC9lNzhkMDdjYS02ODBmLTExZTUtYTU3Zi0yMWI4OGY3ZDk3M2YuaHRtbCIsInRhZ3MiOiJzZWN0aW9ucy5Db21wYW5pZXMsc2VjdGlvbnMuRmluYW5jaWFscyxzZWN0aW9ucy5GaW5hbmNpYWxfU2VydmljZXMsc2VjdGlvbnMuVUtfQ29tcGFuaWVzLGF1dGhvcnMuRGF2aWRfT2FrbGV5LGF1dGhvcnMuTmF0aGFsaWVfVGhvbWFzIiwiaXNzIjoidXJuOmxpdmVmeXJlOmZ0LTEuZnlyZS5jbzpzaXRlPTM3NzE5NyIsImlhdCI6MTQ0NzA3OTYwNH0.oW2sCELfPTlj_7JLVzVhhiM86mRpW56uYNDcP4D7Tj8\",\n    \"checksum\": \"974b4240f9ad8423015612809be6990f\",\n    \"notAllowedToCreateCollection\": true\n }",
          "type": "json"
        },
        {
          "title": "Unclassified article",
          "content": "HTTP/1.1 200 OK\n {\n    \"unclassifiedArticle\": true\n }",
          "type": "json"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/init",
    "title": "Init",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "init",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "articleId",
            "description": "<p>ID of the article.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "url",
            "description": "<p>Url of the article.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "title",
            "description": "<p>Title of the article.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "el",
            "description": "<p>ID of a DOM element in which the widget should be loaded. It is echoed in the response.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "stream_type",
            "description": "<p>Can be one of 'livecomments', 'liveblog', 'livechat'. Default is 'livecomments'.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "tags",
            "description": "<p>Additional tags for the collection (added to the default of CAPI and URL based tags). Comma separated.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "sessionId",
            "description": "<p>Session ID of the user. Optional, if not present FTSession is read from the cookies.</p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "<p>Object</p> ",
            "optional": false,
            "field": "init",
            "description": "<p>Data about the article</p> "
          },
          {
            "group": "success",
            "type": "<p>Number</p> ",
            "optional": false,
            "field": "init.siteId",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "init.articleId",
            "description": ""
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "init.collectionMeta",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "init.checksum",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "init.notAllowedToCreateCollection",
            "description": "<p>Present only if the user is not authenticated and the collection does not exist. In this case this user is not allowed to create the collection.</p> "
          },
          {
            "group": "success",
            "type": "<p>Object</p> ",
            "optional": false,
            "field": "auth",
            "description": "<p>Data about the user</p> "
          },
          {
            "group": "success",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "auth.token",
            "description": "<p>Auth token of Livefyre. See <a href=\"http://answers.livefyre.com/developers/getting-started/tokens/auth/\">Livefyre documentation</a></p> "
          },
          {
            "group": "success",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "auth.expires",
            "description": "<p>Timestamp of when the token expires.</p> "
          },
          {
            "group": "success",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "auth.displayName",
            "description": "<p>The user's pseudonym (nickname).</p> "
          },
          {
            "group": "success",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "auth.settings",
            "description": "<p>The user's email notification settings.</p> "
          }
        ],
        "unclassified": [
          {
            "group": "unclassified",
            "type": "<p>Object</p> ",
            "optional": false,
            "field": "init",
            "description": "<p>Data about the article</p> "
          },
          {
            "group": "unclassified",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "init.unclassifiedArticle",
            "description": "<p>Relates to the legacy mapping of articles to different sites based on primary section/URL. If the URL was not mapped by the legacy mapping logic, flag it.</p> "
          }
        ],
        "no pseudonym": [
          {
            "group": "no pseudonym",
            "type": "<p>Object</p> ",
            "optional": false,
            "field": "auth",
            "description": "<p>Data about the user</p> "
          },
          {
            "group": "no pseudonym",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "auth.pseudonym",
            "description": "<p>Pseudonym false is the flag that the user does not have a pseudonym yet.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"init\": {\n         \"siteId\": 377197,\n         \"articleId\": \"e78d07ca-680f-11e5-a57f-21b88f7d973f\",\n         \"collectionMeta\": \"eyJ0eXAiOiJKV1QiLCJhbGDHD253IUzI1NiJ9.eyJ0eXBlIjoi456GSHRFFHFdGl0bGUiOiJLYXRoZXJpg4dfGSD46b3ggc3RlcHMgYmFjayBpbiBBbGxpYW5jZSBUcnVzdCBzaGFrZS11cCIsImFydGljbGVJZCI6ImU3OGQwN2NhLTY4MGYtMTFlNS1hNTdmLTIxYjg4ZjdkOTczZiIsInVybCI6Imh0dHA6Ly93d3cuZnQuY29tL2ludGwvY21zL3MvMC9lNzhkMDdjYS02ODBmLTExZTUtYTU3Zi0yMWI4OGY3ZDk3M2YuaHRtbCIsInRhZ3MiOiJzZWN0aW9ucy5Db21wYW5pZXMsc2VjdGlvbnMuRmluYW5jaWFscyxzZWN0aW9ucy5GaW5hbmNpYWxfU2VydmljZXMsc2VjdGlvbnMuVUtfQ29tcGFuaWVzLGF1dGhvcnMuRGF2aWRfT2FrbGV5LGF1dGhvcnMuTmF0aGFsaWVfVGhvbWFzIiwiaXNzIjoidXJuOmxpdmVmeXJlOmZ0LTEuZnlyZS5jbzpzaXRlPTM3NzE5NyIsImlhdCI6MTQ0NzA3OTYwNH0.oW2sCELfPTlj_7JLVzVhhiM86mRpW56uYNDcP4D7Tj8\",\n         \"checksum\": \"974b4cc0f9gf7813015612809be6990f\",\n         \"el\": \"dom-element-id\"\n     },\n     \"auth\": {\n         \"token\": \"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkb21haW4iOiJmdC0xHRV4567GGRVJDSoiOTAyNjUwMiIsImRpc3BsYXlfbmFtZSGS45681265dsSDGbjMiLCJleHBpcmVmdIDGKSDOaswLjQxNSwiaWF0IjoxNDQ3MDgzNTAxfQ.vDVUaBrd-qGFQFKvAEQMGSD45239SHDuCh_tXZR1WwRg\",\n         \"expires\": 1462635461193,\n         \"displayName\": \"the avenger\",\n         \"settings\": {\n             \"emailcomments\": \"hourly\",\n             \"emaillikes\": \"never\",\n             \"emailreplies\": \"immediately\",\n             \"emailautofollow\": \"off\"\n         }\n     }\n }",
          "type": "json"
        },
        {
          "title": "Unclassified article",
          "content": "HTTP/1.1 200 OK\n {\n    \"init\": {\n        \"unclassifiedArticle\": true\n    },\n    \"auth\": {\n        ....\n    }\n }",
          "type": "json"
        },
        {
          "title": "No pseudonym",
          "content": "HTTP/1.1 200 OK\n {\n    \"init\": {\n        ...\n    },\n    \"auth\": {\n        \"pseudonym\": false\n    }\n }",
          "type": "json"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/metadata",
    "title": "Metadata",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "metadata",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "articleId",
            "description": "<p>ID of the article.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "url",
            "description": "<p>Url of the article.</p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>Array</p> ",
            "optional": false,
            "field": "-",
            "description": "<p>List of tags based on CAPI and the URL of the article.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n [\n   \"sections.World\",\n   \"authors.Naomi Ronvick\",\n   \"brand.The World\",\n   \"blog\",\n   \"the-world\"\n ]",
          "type": "json"
        },
        {
          "title": "No tags found",
          "content": "HTTP/1.1 200 OK\n []",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "<p>Array</p> ",
            "optional": false,
            "field": "-",
            "description": "<p>Empty list</p> "
          }
        ]
      }
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/profile",
    "title": "User profile for Livefyre",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "profile",
    "description": "<p>Used for Livefyre's ping for pull mechanism. It returns the user's profile in a format that Livefyre understands. See <a href=\"http://answers.livefyre.com/developers/identity-integration/your-identity/#BuildTheResponse\">Livefyre documentation</a></p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "id",
            "description": "<p>ID of the user (either eRights ID or UUID).</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "lftoken",
            "description": "<p>System token of the Livefyre network. See <a href=\"http://answers.livefyre.com/developers/libraries/methods/network/#link-buildlivefyretoken-nodejs\">Livefyre documentation</a></p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "id",
            "description": "<p>ID of the user (eRights ID if it exists, otherwise UUID)</p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "email",
            "description": "<p>Email address of the user</p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "first_name",
            "description": "<p>First name of the user</p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "last_name",
            "description": "<p>Last name of the user</p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "display_name",
            "description": "<p>Pseudonym (nickname) of the user</p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "email_notifications",
            "description": "<p>Email notifications</p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "email_notifications.comments",
            "description": "<p>Email notifications in case someone comments in a conversation the user is following</p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "email_notifications.likes",
            "description": "<p>Email notifications in case someone likes the user's comment</p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "email_notifications.replies",
            "description": "<p>Email notifications in case someone replies to the user's comment</p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "autofollow_conversations",
            "description": "<p>Auto-follow any conversation after the user posts a comment in it</p> "
          },
          {
            "group": "success",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "settings_url",
            "description": "<p>URL to the user's profile page</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n {\n     \"id\": \"9036415\",\n     \"email\": \"john.rush@ft.com\",\n     \"first_name\": \"John\",\n     \"last_name\": \"Rush\",\n     \"display_name\": \"myname\",\n     \"email_notifications\": {\n         \"comments\": \"immediately\",\n         \"likes\": \"never\",\n         \"replies\": \"often\"\n     },\n     \"autofollow_conversations\": \"false\",\n     \"settings_url\": \"\"\n }",
          "type": "json"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get / post",
    "url": "v1/user/emptyPseudonym",
    "title": "Empty pseudonym",
    "version": "1.1.0",
    "group": "v1_user",
    "name": "emptyPseudonym",
    "description": "<p>Empties the user's pseudonym.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "sessionId",
            "description": "<p>Session ID of the user. Optional, if not present FTSession is read from the cookies.</p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"status\": \"ok\"\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update.</p> "
          },
          {
            "group": "Error 4xx",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "error",
            "description": "<p>Error message.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Not logged in",
          "content": "HTTP/1.1 401 Unauthorized\n {\n     \"status\": \"error\",\n     \"error\": \"User session is not valid.\"\n }",
          "type": "401"
        }
      ]
    },
    "filename": "app/routes/v1/user.js",
    "groupTitle": "v1_user"
  },
  {
    "type": "get",
    "url": "v1/user/getauth",
    "title": "Auth",
    "version": "1.1.0",
    "group": "v1_user",
    "name": "getauth",
    "description": "<p>Returns authentication information about the user.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "sessionId",
            "description": "<p>Session ID of the user. Optional, if not present FTSession is read from the cookies.</p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "<p>Object</p> ",
            "optional": false,
            "field": "auth",
            "description": "<p>Data about the user</p> "
          },
          {
            "group": "success",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "auth.token",
            "description": "<p>Auth token of Livefyre. See <a href=\"http://answers.livefyre.com/developers/getting-started/tokens/auth/\">Livefyre documentation</a></p> "
          },
          {
            "group": "success",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "auth.expires",
            "description": "<p>Timestamp of when the token expires.</p> "
          },
          {
            "group": "success",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "auth.displayName",
            "description": "<p>The user's pseudonym (nickname).</p> "
          },
          {
            "group": "success",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "auth.settings",
            "description": "<p>The user's email notification settings.</p> "
          }
        ],
        "no pseudonym": [
          {
            "group": "no pseudonym",
            "type": "<p>Object</p> ",
            "optional": false,
            "field": "auth",
            "description": "<p>Data about the user</p> "
          },
          {
            "group": "no pseudonym",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "auth.pseudonym",
            "description": "<p>Pseudonym false is the flag that the user does not have a pseudonym yet.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"token\": \"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkb21haW4iOiJmdC0xHRV4567GGRVJDSoiOTAyNjUwMiIsImRpc3BsYXlfbmFtZSGS45681265dsSDGbjMiLCJleHBpcmVmdIDGKSDOaswLjQxNSwiaWF0IjoxNDQ3MDgzNTAxfQ.vDVUaBrd-qGFQFKvAEQMGSD45239SHDuCh_tXZR1WwRg\",\n     \"expires\": 1462635461193,\n     \"displayName\": \"the avenger\",\n     \"settings\": {\n         \"emailcomments\": \"hourly\",\n         \"emaillikes\": \"never\",\n         \"emailreplies\": \"immediately\",\n         \"emailautofollow\": \"off\"\n     }\n }",
          "type": "json"
        },
        {
          "title": "No pseudonym",
          "content": "HTTP/1.1 200 OK\n {\n    \"pseudonym\": false\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "Unauthorized",
          "content": "HTTP/1.1 401 Unauthorized\n  Unauthorized",
          "type": "401"
        }
      ]
    },
    "filename": "app/routes/v1/user.js",
    "groupTitle": "v1_user"
  },
  {
    "type": "get / post",
    "url": "v1/user/setPseudonym",
    "title": "Set pseudonym",
    "version": "1.1.0",
    "group": "v1_user",
    "name": "setPseudonym",
    "description": "<p>Updates the user's pseudonym.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "pseudonym",
            "description": "<p>Pseudonym to be set.</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "sessionId",
            "description": "<p>Session ID of the user. Optional, if not present FTSession is read from the cookies.</p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"status\": \"ok\"\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update.</p> "
          },
          {
            "group": "Error 4xx",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "error",
            "description": "<p>Error message.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Pseudonym empty",
          "content": "HTTP/1.1 400 Bad request\n {\n     \"status\": \"error\",\n     \"error\": \"Pseudonym invalid or not provided.\"\n }",
          "type": "400"
        },
        {
          "title": "Not logged in",
          "content": "HTTP/1.1 401 Unauthorized\n {\n     \"status\": \"error\",\n     \"error\": \"User session is not valid.\"\n }",
          "type": "401"
        }
      ]
    },
    "filename": "app/routes/v1/user.js",
    "groupTitle": "v1_user"
  },
  {
    "type": "get / post",
    "url": "v1/user/updateuser",
    "title": "Update user",
    "version": "1.1.0",
    "group": "v1_user",
    "name": "updateUser",
    "description": "<p>Updates the user's comments settings: pseudonym, email notification preferences.</p> ",
    "filename": "app/routes/v1/user.js",
    "groupTitle": "v1_user"
  }
] });