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
        
        this.gTags = [];
        
        var that = this;
        
        Ext.Array.each(data, function(tagRecord) {
            that.gTags.push({
                Name: tagRecord.get('Name'),
                OID: tagRecord.get('ObjectID'),
                UsedIn: ""
            });
            
            var tagID = tagRecord.get('ObjectID');
            
            Ext.create('Rally.data.lookback.SnapshotStore', {
                autoLoad: true,
                listeners: {
                    load: function(dataStore, records) {
                        var artifactIDs = [];
                        Ext.Array.each(records, function(artifactRecord) {
                            // Generate a list artifact IDs that the tag belongs to
                            var id;
                            var artifactType = artifactRecord.get('_TypeHierarchy');
                            if (artifactType[artifactType.length - 1] == "HierarchicalRequirement") {
                                id = 'US' + artifactRecord.get('_UnformattedID');
                            } else if (artifactType[artifactType.length - 1] == "Defect") {
                                id = 'DE' + artifactRecord.get('_UnformattedID');
                            } else if (artifactType[artifactType.length - 1] == "Task") {
                                id = 'TA' + artifactRecord.get('_UnformattedID');
                            }
                            for (var j = 0; j < that.gTags.length; j++) {
                                if (that.gTags[j].OID === tagID) {
                                    if (!Ext.Array.contains(artifactIDs, id)) {
                                        if (that.gTags[j].UsedIn === "") {
                                            that.gTags[j].UsedIn = id;
                                        }
                                        else {
                                            that.gTags[j].UsedIn += (", " + id);
                                        }
                                        artifactIDs.push(id);
                                    }
                                }
                            }
                        });                        
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
                data: this.gTags,
                pageSize: 200
            }),
            columnCfgs: [
                {
                    text: 'Name', dataIndex: 'Name', flex: 1
                },
                {
                    text: 'Added By'//, dataIndex: 'Creator'
                },
                {
                    text: 'Created On'//, dataIndex: 'DateCreated'
                },
                {
                    text: 'Associated Artifacts', dataIndex: 'UsedIn'
                }
            ]
        });
    }
});