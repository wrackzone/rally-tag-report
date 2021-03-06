rally-tag-report
=========================

## Overview
Creates a grid that can be used in Rally's Custom HTML app for getting information on tag usage.

Generates a list of all tags and what artifacts they're used in.  Also uses Rally's Lookback API to 
determine who created the tag and when the tag was last used by looking back to the earliest snapshot
in which the tag was used to see who created the revision in which the tag was first used, then looking
at the revision date of the most recent snapshot in which the tag was introduced to determine the
date the tag was last used.

## License

AppTemplate is released under the MIT license.  See the file [LICENSE](https://raw.github.com/RallyApps/AppTemplate/master/LICENSE) for the full text.