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
        
        this.gRecords = [];
        this.gData = data;  // Contains data from all tags
        console.log(this.gData);
        
        var that = this;
        
        Ext.Array.each(that.gData, function(tagRecord) {
            that.gRecords.push({
                Name: tagRecord.get('Name'),
                OID: tagRecord.get('ObjectID'),
                UsedIn: null
            });    
        });
        
       Ext.create('Rally.data.lookback.SnapshotStore', {
            autoLoad: true,
            listeners: {
                load: this._onDataLoaded,
                scope: this
            },
            fetch: ['_UnformattedID', 'Tags'],
            hydrate: ['Tags'],
            filters: [
                 {
                     property: '_TypeHierarchy',
                     operator: 'in',
                     value: ['Defect']
                 },
                 {
                     property: 'Tags',
                     operator: '!=',
                     value: null
                 },
                 {
                     property: 'Tags._PreviousValues',
                     operator: '=',
                     value: null
                 }
            ]
        });
    },

    _onDataLoaded: function(store, data) {
        
        var that = this;
        
        // TODO: Does not remove duplicate UnformattedIDs, doesn't prefix UnformattedIDs with DE, US, TA
        //       Need to check for null and remove it before appending UnformattedIDs to the UsedIn field
        Ext.Array.each(data, function(artifactRecord) {
            var recordTags = artifactRecord.get('Tags');
            var artifactIDs = [];
            var id = artifactRecord.get('_UnformattedID');
            for(var i = 0; i < recordTags.length; i++) {
                for (var j = 0; j < that.gRecords.length; j++) {
                    if (that.gRecords[j].OID === recordTags[i]) {
                        if (!Ext.Array.contains(artifactIDs, id)) {
                            that.gRecords[j].UsedIn += (id + ", ");
                            Ext.Array.push(id);
                        }
                    }
                }
            }
        });

        this.add({
            xtype: 'rallygrid',
            store: Ext.create('Rally.data.custom.Store', {
                data: that.gRecords,
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