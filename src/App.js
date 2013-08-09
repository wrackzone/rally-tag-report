Ext.define('CustomApp', {
                extend: 'Rally.app.App',
                componentCls: 'app',
            
                launch: function() {
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
                    
                    var records = [];
                    Ext.Array.each(data, function(record) {
                        records.push({
                            Name: record.get('Name'),
                            Creator: null,
                            DateCreated: null,
                            UsedIn: null
                        });
                        
                    });
                    
                   /* Ext.create('Rally.data.WsapiDataStore', {
                        autoLoad: true,
                        listeners: {
                            load: this._onDataLoaded,
                            scope: this
                        },
                        filters: [
                             {
                                 property: '_TypeHierarchy',
                                 operator: 'in',
                                 value: ['Artifact']
                             }   
                        ],
                    });
                },
            
                _onDataLoaded: function(store, data) {
                    var records = [];
                    Ext.Array.each(data, function(record) {
                        //Perform custom actions with the data here
                        //Calculations, etc.
                        records.push({
                            Name: record.get('Name'),
                        });
                        
                    });*/
            
                    this.add({
                        xtype: 'rallygrid',
                        store: Ext.create('Rally.data.custom.Store', {
                            data: records,
                            pageSize: 5
                        }),
                        columnCfgs: [
                            {
                                text: 'Name', dataIndex: 'Name', flex: 1
                            },
                            {
                                text: 'Added By', dataIndex: 'Creator'
                            },
                            {
                                text: 'Created On', dataIndex: 'DateCreated'
                            },
                            {
                                text: 'Associated Artifacts', dataIndex: 'UsedIn'
                            }
                        ]
                    });
                }
            });