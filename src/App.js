Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        // Get a list of all tags
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'Tag',
            fetch: ['Name'],
            autoLoad: true,
            listeners: {
                load: this._retrieveArtifacts,
                scope: this
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
                Creator: null,
                LastUsed: null
            };
            
            
            // Querying on all associated artifacts for a given tag, and sorting them oldest to newest
            Ext.create('Rally.data.lookback.SnapshotStore', {
                autoLoad: true,
                listeners: {
                    load: function(dataStore, records) {
                        var artifactIDs = [];
                        // Generate a list artifact IDs that the tag belongs to
                        // TODO: add in other other taggable artifacts (test cases, test runs?)
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
                        
                        /*
                            // Filter out all records where a tag wasn't introduced for the first time
                            var initialRecords =_.filter(records, function(record) { 
                                return !_.contains(record._PreviousValues.Tags, tagID)
                            });
                        */    
                    },
                    scope: that
                },
                fetch: ['_UnformattedID', 'Tags', '_User', '_TypeHierarchy'],
                hydrate: ['_TypeHierarchy'],
                filters: [
                     {
                         property: '_TypeHierarchy',
                         operator: 'in',
                         value: ['Defect', 'Task', 'HierarchicalRequirement']
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
        
        this._renderGrid();
    },

    
    _renderGrid: function() {
        this.add({
            xtype: 'rallygrid',
            store: Ext.create('Rally.data.custom.Store', {
                data: _.toArray(this.gTags),
                pageSize: 200
            }),
            columnCfgs: [
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'Added By'//, dataIndex: 'Creator'
                },
                {
                    text: 'Last Used'//, dataIndex: 'LastUsed'
                },
                {
                    text: 'Associated Artifacts', dataIndex: 'UsedIn', flex: 1
                }
            ]
        });
    }
});