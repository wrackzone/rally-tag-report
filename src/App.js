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
                        // TODO: Doesn't prefix UnformattedIDs with DE, US, TA
                        var artifactIDs = [];
                        Ext.Array.each(records, function(artifactRecord) {
                            var id = artifactRecord.get('_UnformattedID');
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
                fetch: ['_UnformattedID', 'Tags', '_User'],
                filters: [
                     {
                         property: '_TypeHierarchy',
                         operator: 'in',
                         value: ['Defect']
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
                pageSize: 20
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