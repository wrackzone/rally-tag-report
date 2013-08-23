Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        // Fetch a list of users so we can map ObjectIDs to DisplayNames
        Ext.create('Rally.data.WsapiDataStore', {
           model: 'user',
           fetch: ['ObjectID', 'FirstName', 'LastName'],
           autoLoad: true,
           limit: Infinity,
           context: this.getContext().getDataContext(),
           listeners: {
               load: this._retrieveTags,
               scope: this
           }
        });
    },
    
    _retrieveTags: function(store, data) {
        this.gUsers = {};
        var that = this;
        _.each(data, function(user) {
            var userID = user.get('ObjectID');
            that.gUsers[userID] = user.get('FirstName') + " " + user.get('LastName');
        });
        
        
        // Get a list of all tags
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'Tag',
            fetch: ['Name'],
            autoLoad: true,
            listeners: {
                load: that._retrieveArtifacts,
                scope: that
            }
        });
    },
    
    _retrieveArtifacts: function(store, data) {
        this.gTags = {};
        var that = this;

        
        // For each of the tags, capture the name and then query on all associated artifacts
       _.each(data, function(tagRecord) {
            var tagID = tagRecord.get('ObjectID');
            that.gTags[tagID] = {
                Name: tagRecord.get('Name'),
                UsedIn: "",
                Creator: "",
                LastUsed: ""
            };
            
            
            // Querying on all associated artifacts for a given tag, and sorting them oldest to newest
            Ext.create('Rally.data.lookback.SnapshotStore', {
                autoLoad: true,
                listeners: {
                    load: function(dataStore, records) {
                        var artifactIDs = [];
                        // Generate a list artifact IDs that the tag belongs to
                        _.each(records, function(artifactRecord) {
                            // Since LBAPI only cares about UnformattedID, following code identifies the 
                            // artifact type and prefixes it appropriately in the chart
                            var id;
                            var artifactType = artifactRecord.get('_TypeHierarchy');
                            // artifactType is an array of hierarchy classifications where
                            // last element is the specific artifact type (Defect, Task, etc.)
                            if (artifactType[artifactType.length - 1] == "HierarchicalRequirement") {
                                id = 'US' + artifactRecord.get('_UnformattedID');
                            } else if (artifactType[artifactType.length - 1] == "Defect") {
                                id = 'DE' + artifactRecord.get('_UnformattedID');
                            } else if (artifactType[artifactType.length - 1] == "Task") {
                                id = 'TA' + artifactRecord.get('_UnformattedID');
                            } else if (artifactType[artifactType.length - 1] == "TestCase") {
                                id = 'TC' + artifactRecord.get('_UnformattedID');
                            }
                            
                            
                            // This block removes duplicate artifacts since we're dealing with snapshots
                            // and builds list of associated artifacts
                            if (!_.contains(artifactIDs, id)) {
                                if (that.gTags[tagID].UsedIn === "") {
                                    that.gTags[tagID].UsedIn = id;
                                }
                                else {
                                    that.gTags[tagID].UsedIn += (", " + id);
                                }
                                artifactIDs.push(id);
                            }
                        
                            
                        });
                        
                        
                        // This is not filtering properly, it is still picking up ALL snapshots
                        // rather than just the ones that introduced a tag
                        // Filter out all records where a tag wasn't introduced for the first time
                        // so we can capture what _User added the tag
                        var initialRecords = _.reject(records, function(record) {
                            return _.contains(record.data._PreviousValues.Tags, tagID);
                        });
                        
                        // Sort all snapshots by date to determine the last snapshot in which a tag was introduced (LastUsed),
                        // and the first snapshot in which the tag was introduced to capture the _User (Creator)
                        var sortedRecords = _.sortBy(initialRecords, "_ValidFrom");
                        
                        // The date this is returning does not seem to be quite right
                        that.gTags[tagID].LastUsed = sortedRecords[sortedRecords.length - 1].data._ValidFrom;
                        
                        that.gTags[tagID].Creator = that.gUsers[sortedRecords[0].data._User];
                        
                        if (that.down('#myGrid')) {
                            that.remove('myGrid');
                        }
                        
                        that._renderGrid();
                        
                        
                    },
                    scope: that
                },
                fetch: ['_UnformattedID', 'Tags', '_User', '_TypeHierarchy', '_PreviousValues'],
                hydrate: ['_TypeHierarchy'],
                filters: [
                     {
                         property: '_TypeHierarchy',
                         operator: 'in',
                         value: ['Defect', 'Task', 'HierarchicalRequirement', 'TestCase']
                     },
                     {
                         property: 'Tags',
                         value: tagID
                     }
                ],
                sorters: [
                    {
                        property: '_ValidFrom',
                        direction: 'ASC'
                        
                    }
                ]
            });
            
        });
    },

    
    _renderGrid: function() {
        this.add({
            xtype: 'rallygrid',
            itemId: 'myGrid',
            store: Ext.create('Rally.data.custom.Store', {
                data: _.toArray(this.gTags),
                pageSize: 200
            }),
            columnCfgs: [
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'Added By', dataIndex: 'Creator'
                },
                {
                    text: 'Last Used', dataIndex: 'LastUsed'
                },
                {
                    text: 'Associated Artifacts', dataIndex: 'UsedIn', flex: 1
                }
            ]
        });
    }
});