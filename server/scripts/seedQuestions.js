
const mongoose = require('mongoose')
const Question = require('../models/Question')

const TOPICS = {
  'Web Development': {
    easy: [
      ['Which language structures web pages?', ['CSS', 'HTML', 'SQL', 'Python'], 1, 'HTML defines page structure.'],
      ['Which language styles web pages?', ['CSS', 'SQL', 'Bash', 'C'], 0, 'CSS controls presentation and styling.'],
      ['Which HTML tag creates a hyperlink?', ['<p>', '<a>', '<h1>', '<table>'], 1, 'The anchor tag creates hyperlinks.'],
      ['Which HTML tag inserts an image?', ['<image>', '<picture-src>', '<img>', '<src>'], 2, 'The img element embeds an image.'],
      ['Which CSS property changes text color?', ['font-size', 'color', 'padding', 'display'], 1, 'The color property sets text color.'],
      ['Which HTML element creates a paragraph?', ['<p>', '<div-only>', '<para>', '<text>'], 0, 'The p element represents a paragraph.'],
      ['Which attribute provides alternative image text?', ['href', 'alt', 'target', 'rel'], 1, 'The alt attribute provides alternative text.'],
      ['Which CSS property sets an element background color?', ['background-color', 'font-weight', 'line-height', 'overflow'], 0, 'background-color controls the background color.'],
      ['Which HTML element creates an unordered list?', ['<ol>', '<ul>', '<li-only>', '<list>'], 1, 'The ul element creates a bulleted list.'],
      ['Which protocol is commonly used to load web pages securely?', ['FTP', 'HTTP only', 'HTTPS', 'SMTP'], 2, 'HTTPS encrypts HTTP communication using TLS.'],
    ],
    medium: [
      ['Which CSS layout system uses rows and columns?', ['Float', 'Grid', 'Inline text', 'Clearfix'], 1, 'CSS Grid is designed for two-dimensional layouts.'],
      ['What does the CSS box model include?', ['Content only', 'Content and color', 'Content, padding, border, margin', 'Only margin and border'], 2, 'The box model consists of content, padding, border, and margin.'],
      ['Which selector targets elements with class card?', ['#card', '.card', 'card()', '*card'], 1, 'A dot selects a class in CSS.'],
      ['What does responsive design aim to do?', ['Disable mobile devices', 'Adapt layouts to different screens', 'Replace HTML', 'Remove CSS'], 1, 'Responsive layouts adapt to screen sizes and devices.'],
      ['Which CSS unit is relative to the root font size?', ['px', 'rem', 'cm', 'pt'], 1, 'rem is relative to the root element font size.'],
      ['Which HTML attribute associates a label with a form control?', ['for', 'href', 'src', 'action'], 0, 'The label for attribute matches a control id.'],
      ['What does the CSS property position: fixed do?', ['Keeps an element relative to the viewport', 'Hides an element', 'Makes text bold', 'Creates a grid'], 0, 'Fixed positioning places an element relative to the viewport.'],
      ['Which status code commonly indicates a successful HTTP request?', ['301', '403', '200', '500'], 2, 'HTTP 200 means the request succeeded.'],
      ['What is the purpose of an HTML form?', ['Collect user input', 'Style all text', 'Create database indexes', 'Compile JavaScript'], 0, 'Forms collect and submit user input.'],
      ['Which CSS property controls space inside an element border?', ['margin', 'padding', 'outline', 'gap-only'], 1, 'Padding is the space between content and border.'],
    ],
    hard: [
      ['What does the CSS specificity order generally prioritize?', ['Universal selectors over IDs', 'IDs over classes', 'Element selectors over IDs', 'All selectors equally'], 1, 'ID selectors generally have higher specificity than class selectors.'],
      ['Which browser mechanism commonly stores HTTP cookies?', ['Cookie storage managed by the browser', 'CSS variables', 'HTML comments', 'DOM class names only'], 0, 'Browsers store cookies and attach eligible cookies to requests.'],
      ['What is the main purpose of Content Security Policy?', ['Compress images', 'Restrict permitted resource sources', 'Create HTML elements', 'Replace HTTPS'], 1, 'CSP helps mitigate injection attacks by restricting resource sources.'],
      ['What does CORS control?', ['Database transactions', 'Cross-origin browser requests', 'CSS inheritance', 'Image dimensions'], 1, 'CORS controls browser access to cross-origin responses.'],
      ['Why use semantic HTML elements?', ['They remove the DOM', 'They communicate meaning and structure', 'They encrypt forms', 'They replace CSS'], 1, 'Semantic elements improve meaning, accessibility, and document structure.'],
      ['What is event delegation in the DOM?', ['Adding one ancestor listener for descendant events', 'Disabling all events', 'Creating a new browser tab', 'Changing CSS specificity'], 0, 'Event bubbling lets an ancestor handle events from descendants.'],
      ['Which technique can reduce layout shifts for images?', ['Reserve dimensions or aspect ratio', 'Remove alt text', 'Use more nested divs', 'Disable caching'], 0, 'Reserved image space reduces unexpected layout movement.'],
      ['What is the purpose of an HTTP cache validator such as ETag?', ['Identify a representation version', 'Encrypt the password', 'Create CSS classes', 'Open a database connection'], 0, 'ETag supports cache validation using a representation identifier.'],
      ['What does progressive enhancement mean?', ['Start with core functionality and enhance when supported', 'Require every browser feature', 'Remove basic HTML', 'Only support one screen size'], 0, 'Progressive enhancement keeps core functionality available before advanced features.'],
      ['Which attribute helps prevent a new tab opened with target blank from accessing the opener?', ['rel="noopener"', 'alt="secure"', 'type="fixed"', 'class="private"'], 0, 'noopener prevents the opened page from receiving a usable opener reference.'],
    ],
  },

  JavaScript: {
    easy: [
      ['Which keyword declares a block-scoped variable?', ['var', 'let', 'define', 'dim'], 1, 'let declares a block-scoped variable.'],
      ['Which value represents a deliberate absence of an object value?', ['null', 'true', 'NaN only', 'Infinity'], 0, 'null represents an intentional absence of value.'],
      ['Which operator checks strict equality?', ['=', '==', '===', '=>'], 2, '=== compares without type coercion.'],
      ['Which method converts JSON text into a JavaScript value?', ['JSON.stringify()', 'JSON.parse()', 'JSON.read()', 'JSON.object()'], 1, 'JSON.parse parses JSON text.'],
      ['Which keyword defines a function?', ['func', 'function', 'method', 'define'], 1, 'function declares a function.'],
      ['Which array method adds an item to the end?', ['pop()', 'shift()', 'push()', 'slice()'], 2, 'push adds one or more elements to the end.'],
      ['Which value is a Boolean?', ['"false"', '0', 'false', '"true"'], 2, 'false without quotes is a Boolean value.'],
      ['Which symbol starts a single-line comment?', ['<!--', '//', '**', '##'], 1, '// begins a JavaScript single-line comment.'],
      ['Which keyword creates a constant binding?', ['let', 'const', 'static', 'fixed'], 1, 'const declares a binding that cannot be reassigned.'],
      ['Which built-in function converts text to an integer?', ['parseInt()', 'toText()', 'makeInt()', 'integer()'], 0, 'parseInt parses an integer from a string.'],
    ],
    medium: [
      ['What does Array.map() return?', ['The original array only', 'A new array of mapped results', 'A Boolean', 'A number always'], 1, 'map returns a new array containing callback results.'],
      ['What does Array.filter() do?', ['Removes every element', 'Returns elements that pass a test', 'Sorts numbers only', 'Changes strings to numbers'], 1, 'filter creates an array of elements passing the predicate.'],
      ['What does Promise.all() do when one promise rejects?', ['Always fulfills', 'Rejects when an input promise rejects', 'Retries automatically', 'Ignores every rejection'], 1, 'Promise.all rejects if any input promise rejects.'],
      ['Which operator provides a fallback only for null or undefined?', ['||', '??', '&&', '==='], 1, 'Nullish coalescing uses the fallback for null or undefined.'],
      ['What does a closure retain access to?', ['Only global variables', 'Its lexical environment', 'Only HTML elements', 'No variables'], 1, 'Closures retain access to variables from their lexical scope.'],
      ['What does destructuring do?', ['Extracts values from arrays or objects', 'Deletes a database', 'Encrypts values', 'Sorts every object'], 0, 'Destructuring unpacks values into variables.'],
      ['Which method converts a JavaScript value to JSON text?', ['JSON.parse()', 'JSON.stringify()', 'JSON.decode()', 'JSON.toObject()'], 1, 'JSON.stringify serializes supported values into JSON text.'],
      ['What does async make a function return?', ['Always a number', 'A Promise', 'A DOM node', 'A generator only'], 1, 'An async function returns a Promise.'],
      ['Which array method accumulates values into one result?', ['map()', 'forEach()', 'reduce()', 'includes()'], 2, 'reduce combines array elements into an accumulated result.'],
      ['What does typeof null return in JavaScript?', ['"null"', '"undefined"', '"object"', '"boolean"'], 2, 'typeof null historically returns the string object.'],
    ],
    hard: [
      ['What is the output of Promise.resolve(2).then(x => x + 1)?', ['A promise fulfilled with 2', 'A promise fulfilled with 3', 'A synchronous number 3', 'A rejected promise'], 1, 'The then callback returns 3, which fulfills the chained promise.'],
      ['What does Object.freeze() do to an object?', ['Deep-freezes all nested objects', 'Prevents changes to its own properties', 'Makes it serializable only', 'Deletes its prototype'], 1, 'Object.freeze is shallow and prevents changes to own properties.'],
      ['What is event-loop microtask scheduling commonly used for?', ['Scheduling promise reactions', 'Creating CSS grids', 'Allocating database tables', 'Rendering HTML strings only'], 0, 'Promise reactions are scheduled as microtasks.'],
      ['What does the spread syntax do with an array?', ['Expands its iterable elements', 'Deep-clones every nested object', 'Encrypts each element', 'Makes the array immutable'], 0, 'Spread expands iterable elements into a new syntactic context.'],
      ['What is the main distinction between let and var scope?', ['let is block-scoped; var is function-scoped', 'var is always constant', 'let is global only', 'There is no scope distinction'], 0, 'let uses block scope while var uses function scope.'],
      ['What does Promise.race() settle based on?', ['The first input promise to settle', 'The last promise always', 'Every promise fulfilling', 'Only rejected promises'], 0, 'Promise.race adopts the first settled input result.'],
      ['What does a generator function yield?', ['An iterator when called', 'A Boolean always', 'A JSON string always', 'A DOM element'], 0, 'Calling a generator function returns an iterator.'],
      ['What does optional chaining do when the base is nullish?', ['Throws immediately', 'Returns undefined for that chain access', 'Creates an object', 'Converts null to zero'], 1, 'Optional chaining short-circuits nullish property access.'],
      ['Which statement about JavaScript modules is correct?', ['Each module has its own scope', 'All module variables are global', 'Modules cannot export values', 'Modules run without parsing'], 0, 'Module declarations are scoped to their module unless exported.'],
      ['What is the purpose of AbortController in web APIs?', ['Signal cancellation to supported operations', 'Encrypt network traffic', 'Parse JSON', 'Create a promise automatically'], 0, 'AbortController provides an AbortSignal for cancellable operations.'],
    ],
  },

  'Data Structures': {
    easy: [
      ['Which structure follows LIFO?', ['Queue', 'Stack', 'Graph', 'Heap only'], 1, 'A stack follows Last In, First Out.'],
      ['Which structure follows FIFO?', ['Stack', 'Queue', 'Tree', 'Set'], 1, 'A queue follows First In, First Out.'],
      ['Which structure stores linked nodes?', ['Linked list', 'Integer', 'Boolean', 'Character'], 0, 'Linked lists connect nodes through references.'],
      ['Which structure represents hierarchical relationships?', ['Tree', 'Queue only', 'Stack only', 'Array index'], 0, 'Trees represent parent-child hierarchies.'],
      ['Which structure uses key-value associations?', ['Map', 'Stack only', 'Queue only', 'Plain sequence only'], 0, 'A map associates keys with values.'],
      ['Which structure is commonly used for breadth-first search?', ['Queue', 'Stack', 'Single variable', 'Sorted array only'], 0, 'BFS processes discovered nodes in queue order.'],
      ['Which structure is commonly used for depth-first traversal?', ['Stack', 'Queue only', 'Hash table only', 'Priority value'], 0, 'DFS can use a stack or recursion.'],
      ['What is an array index commonly used for?', ['Accessing an element by position', 'Encrypting an element', 'Sorting a database', 'Creating a network'], 0, 'An index identifies an element position.'],
      ['Which structure is suitable for priority-based removal?', ['Priority queue', 'Ordinary unsorted list only', 'Stack only', 'String'], 0, 'A priority queue removes items according to priority.'],
      ['What is a node in a linked list?', ['A data item with link information', 'Only an array index', 'A sorting algorithm', 'A loop condition'], 0, 'A node stores data and one or more links.'],
    ],
    medium: [
      ['What is binary search time on a sorted array?', ['O(n)', 'O(n²)', 'O(log n)', 'O(2ⁿ)'], 2, 'Binary search halves the remaining search range.'],
      ['What is the average lookup complexity of a well-distributed hash table?', ['O(1)', 'O(n²)', 'O(log n!)', 'O(2ⁿ)'], 0, 'Average hash-table lookup is constant time under suitable assumptions.'],
      ['Which traversal of a binary search tree visits keys in sorted order?', ['Preorder', 'Inorder', 'Level order only', 'Reverse insertion'], 1, 'Inorder traversal visits left subtree, node, then right subtree.'],
      ['What is the worst-case search time in an unbalanced binary search tree?', ['O(1)', 'O(log n) always', 'O(n)', 'O(log log n)'], 2, 'An unbalanced tree may degenerate into a chain.'],
      ['Which operation is typically O(1) for a stack?', ['Push', 'Search arbitrary item', 'Sort all elements', 'Find maximum without metadata'], 0, 'Push adds an item at the top.'],
      ['What is the purpose of a heap?', ['Efficiently access a highest- or lowest-priority item', 'Guarantee all items are sorted in storage', 'Store only strings', 'Replace every graph'], 0, 'A heap maintains a partial order around its root.'],
      ['What is an adjacency list used to represent?', ['Graph neighbors', 'Only tree heights', 'Array capacities', 'Stack top values'], 0, 'An adjacency list stores each vertex and its neighbors.'],
      ['What does a stable sorting algorithm preserve?', ['Relative order of equal-key elements', 'Constant memory in every case', 'Sorted input only', 'Unique values only'], 0, 'Stability preserves the original order of equal-key items.'],
      ['What is the usual time complexity of merge sort?', ['O(n²)', 'O(n log n)', 'O(1)', 'O(2ⁿ)'], 1, 'Merge sort divides and merges across logarithmic levels.'],
      ['What does a circular queue help avoid?', ['Wasted front space in a fixed-size array queue', 'All overflow conditions', 'All duplicate values', 'Every traversal'], 0, 'Circular indexing reuses freed positions in the array.'],
    ],
    hard: [
      ['What is the worst-case time complexity of quicksort?', ['O(n log n)', 'O(n²)', 'O(log n)', 'O(1)'], 1, 'Poor pivot choices can create highly unbalanced partitions.'],
      ['What is the amortized complexity of appending to a dynamic array?', ['O(n) every time', 'O(1)', 'O(log n!)', 'O(n²)'], 1, 'Occasional resizing is spread across many append operations.'],
      ['What does a disjoint-set union structure support efficiently?', ['Connectivity and set merging', 'String formatting', 'Binary search on text', 'Priority scheduling only'], 0, 'Union-find supports merging sets and finding representatives.'],
      ['Which algorithm finds shortest paths with nonnegative edge weights?', ['Dijkstra', 'Depth-first search alone', 'Binary search', 'Merge sort'], 0, 'Dijkstra computes shortest paths when edge weights are nonnegative.'],
      ['What is the typical complexity of BFS using adjacency lists?', ['O(V + E)', 'O(V²E)', 'O(log V)', 'O(2ᴱ)'], 0, 'BFS visits vertices and scans edges.'],
      ['Which condition makes a graph a DAG?', ['It is directed and acyclic', 'It is undirected and complete', 'Every vertex has degree one', 'All edges have equal weight'], 0, 'DAG means directed acyclic graph.'],
      ['What is a common use of a segment tree?', ['Range queries and updates', 'Only storing linked-list pointers', 'Encrypting graph edges', 'Replacing every hash table'], 0, 'Segment trees support range queries and updates efficiently.'],
      ['What is the expected search complexity of a balanced binary search tree?', ['O(log n)', 'O(n²)', 'O(2ⁿ)', 'O(1) for every key'], 0, 'A balanced tree has logarithmic height.'],
      ['Which data structure is commonly used in topological sorting with Kahn’s algorithm?', ['Queue of zero-indegree vertices', 'Stack of sorted strings only', 'Hash of edge weights only', 'Circular array of all paths'], 0, 'Kahn’s algorithm processes vertices whose indegree is zero.'],
      ['What is the worst-case lookup complexity of a hash table with all keys colliding?', ['O(1)', 'O(log n)', 'O(n)', 'O(log log n)'], 2, 'If all keys collide, lookup may scan a linear chain or bucket.'],
    ],
  },

  Databases: {
    easy: [
      ['Which SQL command retrieves rows?', ['INSERT', 'UPDATE', 'SELECT', 'DELETE'], 2, 'SELECT retrieves data from tables.'],
      ['Which database stores BSON-like documents?', ['MongoDB', 'CSS', 'HTML', 'Vite'], 0, 'MongoDB stores documents using BSON.'],
      ['What is a database table made of?', ['Rows and columns', 'Only images', 'CSS rules', 'Functions only'], 0, 'Tables organize records in rows and fields in columns.'],
      ['Which SQL command adds a row?', ['INSERT', 'DROP', 'SELECT', 'GRANT'], 0, 'INSERT adds new records.'],
      ['What is a primary key used for?', ['Uniquely identify a row', 'Style a page', 'Encrypt every column automatically', 'Sort all tables permanently'], 0, 'A primary key uniquely identifies each record.'],
      ['Which command modifies existing rows?', ['UPDATE', 'CREATE', 'SELECT', 'DESCRIBE only'], 0, 'UPDATE changes values in existing rows.'],
      ['Which command removes matching rows?', ['DELETE', 'SELECT', 'ALTER only', 'GRANT'], 0, 'DELETE removes rows matching its condition.'],
      ['What does NULL generally represent in SQL?', ['Missing or unknown value', 'Always zero', 'Always empty text', 'Boolean true'], 0, 'NULL represents an absent or unknown value.'],
      ['Which SQL clause filters rows?', ['WHERE', 'ORDER BY only', 'CREATE', 'VALUES'], 0, 'WHERE selects rows satisfying a condition.'],
      ['What is a database index primarily used for?', ['Speeding up suitable queries', 'Replacing backups', 'Styling tables', 'Guaranteeing no duplicates in all cases'], 0, 'Indexes can accelerate reads but have storage and write costs.'],
    ],
    medium: [
      ['What does a foreign key represent?', ['A relationship referencing another key', 'A CSS class', 'A password format', 'A query comment'], 0, 'A foreign key enforces a reference between records.'],
      ['What does INNER JOIN return?', ['Rows with matching join conditions', 'Every possible row pair', 'Only unmatched left rows', 'All tables in the database'], 0, 'INNER JOIN returns rows meeting the join condition.'],
      ['What is normalization intended to reduce?', ['Redundancy and update anomalies', 'Every query', 'All indexes', 'Every relationship'], 0, 'Normalization organizes data to reduce duplication and anomalies.'],
      ['What does ACID atomicity mean?', ['A transaction happens entirely or not at all', 'Transactions never fail', 'Every query is read-only', 'All columns are unique'], 0, 'Atomicity prevents partial transaction completion.'],
      ['Which MongoDB method commonly finds matching documents?', ['find()', 'paint()', 'style()', 'compile()'], 0, 'find retrieves documents matching a filter.'],
      ['What does GROUP BY do?', ['Groups rows for aggregation', 'Deletes duplicate tables', 'Encrypts records', 'Creates a user account'], 0, 'GROUP BY forms groups used by aggregate expressions.'],
      ['What does ORDER BY specify?', ['Result ordering', 'Table ownership', 'Database password', 'Transaction isolation'], 0, 'ORDER BY sorts query results.'],
      ['What does a unique constraint enforce?', ['No duplicate values for constrained key combinations', 'All values are null', 'Every query uses an index always', 'Rows are sorted physically'], 0, 'Unique constraints reject duplicate constrained values.'],
      ['What is a MongoDB collection?', ['A group of documents', 'A CSS stylesheet', 'A JavaScript function', 'A single field only'], 0, 'Collections contain MongoDB documents.'],
      ['What is a transaction used for?', ['Treating operations as a unit of work', 'Changing CSS', 'Compiling JavaScript', 'Generating HTML tags'], 0, 'Transactions coordinate operations with defined commit or rollback behavior.'],
    ],
    hard: [
      ['What does the SQL isolation level SERIALIZABLE aim to provide?', ['Behavior equivalent to serial execution', 'No locking or conflicts ever', 'Only dirty reads', 'Automatic data compression'], 0, 'Serializable isolation aims to produce serializable transaction outcomes.'],
      ['What is a common trade-off of adding indexes?', ['Faster selected reads but extra storage and write work', 'Faster every operation with no cost', 'No effect on query plans', 'It removes the need for backups'], 0, 'Indexes consume space and must be maintained on writes.'],
      ['What is a dirty read?', ['Reading uncommitted changes from another transaction', 'Reading an indexed row', 'Reading a backup', 'Reading a null value'], 0, 'A dirty read exposes changes that may later be rolled back.'],
      ['What is a compound MongoDB index?', ['An index over multiple fields', 'A database containing multiple servers only', 'A collection without documents', 'A query with no filter'], 0, 'Compound indexes include more than one indexed field.'],
      ['What is the purpose of explain in query analysis?', ['Inspect query plan and execution details', 'Change every row', 'Create user passwords', 'Guarantee the fastest possible plan'], 0, 'Explain provides information about the query execution plan.'],
      ['What does optimistic concurrency control commonly do?', ['Detects conflicting changes before committing', 'Locks every record forever', 'Disables validation', 'Deletes stale indexes automatically'], 0, 'Optimistic approaches detect conflicts rather than locking all work upfront.'],
      ['What is eventual consistency?', ['Replicas may converge after updates propagate', 'Every read always sees the newest write', 'Data is never replicated', 'Transactions never conflict'], 0, 'Eventual consistency allows temporary replica differences before convergence.'],
      ['Why use a database migration?', ['Version and apply schema changes reproducibly', 'Replace all application tests', 'Store CSS styles', 'Avoid database backups'], 0, 'Migrations make structural database changes trackable and repeatable.'],
      ['What does a covering index allow?', ['A query to be answered using index data alone', 'A database to run without storage', 'All writes to become constant time', 'Every query to avoid filtering'], 0, 'A covering index contains the fields needed by a query.'],
      ['What is a deadlock?', ['Transactions wait on resources held by each other', 'A successful index scan', 'A missing database name', 'A query returning zero rows'], 0, 'A deadlock is a cycle of resource waits between transactions.'],
    ],
  },

  'Machine Learning': {
    easy: [
      ['What is supervised learning?', ['Learning from labeled examples', 'Learning without any data', 'Only storing files', 'Deleting all labels'], 0, 'Supervised learning uses examples with known target labels.'],
      ['Which task predicts a category?', ['Classification', 'Regression', 'Compression only', 'Sorting only'], 0, 'Classification predicts discrete classes.'],
      ['Which task predicts a continuous numeric value?', ['Regression', 'Classification only', 'Clustering only', 'Tokenization'], 0, 'Regression predicts numeric quantities.'],
      ['What is a dataset?', ['A collection of data examples', 'A CSS selector', 'A programming keyword', 'A database password'], 0, 'A dataset contains examples used for analysis or modeling.'],
      ['What is a feature in machine learning?', ['An input variable used by a model', 'Only the final prediction', 'A browser tab', 'A database connection'], 0, 'Features are input attributes used for prediction.'],
      ['What is a label in supervised learning?', ['The target value to predict', 'A CSS class only', 'A file extension', 'An index name'], 0, 'Labels provide the expected target output.'],
      ['What does training a model mean?', ['Learning model parameters from data', 'Deleting the training set', 'Creating HTML only', 'Saving a password'], 0, 'Training adjusts model parameters using data and an objective.'],
      ['What is a test set used for?', ['Evaluating performance on held-out data', 'Training on every example repeatedly', 'Storing source code', 'Replacing labels'], 0, 'A test set estimates performance on unseen examples.'],
      ['What is clustering commonly used for?', ['Grouping similar examples without known labels', 'Predicting only labeled classes', 'Sorting source files', 'Encrypting records'], 0, 'Clustering groups examples based on similarity.'],
      ['What is a prediction?', ['A model output for an input', 'Always the true label', 'A database schema', 'A CSS property'], 0, 'A prediction is the model output for given input data.'],
    ],
    medium: [
      ['What does overfitting mean?', ['Model fits training data but generalizes poorly', 'Model cannot fit training data at all', 'Dataset has no rows', 'All predictions are identical by design'], 0, 'Overfitting captures training-specific patterns that fail to generalize.'],
      ['What does precision measure?', ['True positives divided by predicted positives', 'True positives divided by all actual positives', 'Correct predictions divided by all examples', 'False positives divided by true negatives'], 0, 'Precision is TP / (TP + FP).'],
      ['What does recall measure?', ['True positives divided by actual positives', 'True positives divided by predicted positives', 'All correct predictions divided by all examples', 'True negatives divided by all positives'], 0, 'Recall is TP / (TP + FN).'],
      ['Why split data into training and validation sets?', ['To tune choices without using the final test set', 'To guarantee 100% accuracy', 'To remove every feature', 'To avoid evaluation'], 0, 'Validation data helps tune models separately from final evaluation.'],
      ['What does feature scaling do?', ['Puts numeric features on comparable scales', 'Creates labels automatically', 'Removes all missing values always', 'Guarantees no overfitting'], 0, 'Scaling makes feature magnitudes more comparable for sensitive algorithms.'],
      ['What is cross-validation used for?', ['Estimating performance across multiple data splits', 'Encrypting the dataset', 'Replacing the target variable', 'Guaranteeing perfect predictions'], 0, 'Cross-validation evaluates performance across several folds.'],
      ['What is a confusion matrix?', ['A table comparing actual and predicted classes', 'A neural network layer', 'A database index', 'A feature scaling method'], 0, 'A confusion matrix counts outcomes by actual and predicted class.'],
      ['What is regularization intended to do?', ['Discourage overly complex model solutions', 'Increase every weight without limit', 'Delete the labels', 'Replace evaluation metrics'], 0, 'Regularization penalizes complexity to help generalization.'],
      ['What does an unsupervised algorithm generally lack during training?', ['Known target labels for each example', 'Any input features', 'Any numerical operations', 'All observations'], 0, 'Unsupervised learning generally works without labeled targets.'],
      ['What is data leakage?', ['Using information unavailable at prediction time during training', 'Using a validation split correctly', 'Scaling training data only', 'Removing duplicate records'], 0, 'Leakage makes evaluation misleading by exposing unavailable information.'],
    ],
    hard: [
      ['Why can accuracy be misleading on imbalanced data?', ['A majority-class predictor can score highly while missing minority cases', 'Accuracy never counts correct predictions', 'It only applies to regression', 'It always equals recall'], 0, 'Class imbalance can make a high accuracy hide poor minority-class performance.'],
      ['What is the purpose of an ROC curve?', ['Show true-positive rate against false-positive rate across thresholds', 'Plot loss against database size', 'Display feature names only', 'Show regression residuals only'], 0, 'ROC curves compare sensitivity and false-positive rate across thresholds.'],
      ['What does gradient descent do?', ['Updates parameters using gradient information to reduce an objective', 'Sorts labels alphabetically', 'Guarantees a global optimum for every model', 'Removes all features'], 0, 'Gradient descent takes parameter steps based on the objective gradient.'],
      ['What is a bias-variance trade-off?', ['Balancing underfitting and sensitivity to training data', 'Choosing a database password', 'Balancing HTML and CSS', 'A method for sorting arrays'], 0, 'Models must balance systematic error and variance across samples.'],
      ['What is data drift?', ['A change in input data distribution over time', 'A fixed model parameter', 'A database backup', 'A constant learning rate'], 0, 'Data drift describes changes in input distributions.'],
      ['Why is a separate test set important after model selection?', ['It gives a less biased final evaluation on held-out data', 'It tunes every hyperparameter repeatedly', 'It guarantees no sampling error', 'It replaces validation data in every step'], 0, 'A held-out test set should remain untouched during model selection.'],
      ['What does the F1 score combine?', ['Precision and recall through their harmonic mean', 'Accuracy and mean squared error', 'Specificity and training time', 'Loss and dataset size'], 0, 'F1 is the harmonic mean of precision and recall.'],
      ['What is a hyperparameter?', ['A setting chosen outside the model’s learned parameters', 'A target label', 'A predicted class only', 'A database collection'], 0, 'Hyperparameters configure the learning procedure or model structure.'],
      ['What is concept drift?', ['The relationship between inputs and targets changes over time', 'Only the number of rows increases', 'A model file is renamed', 'A feature has a fixed distribution'], 0, 'Concept drift involves changes in the target-generating relationship.'],
      ['Why fit preprocessing only on the training split?', ['To avoid leaking information from validation or test data', 'To make the test set larger', 'To guarantee perfect accuracy', 'To remove the need for a model'], 0, 'Fitting preprocessing on all data can leak information into evaluation.'],
    ],
  },
}

function buildQuestions() {
  const questions = []

  for (const [topic, difficultyGroups] of Object.entries(TOPICS)) {
    for (const difficulty of ['easy', 'medium', 'hard']) {
      const items = difficultyGroups[difficulty]

      if (!Array.isArray(items) || items.length !== 10) {
        throw new Error(
          `${topic} must contain exactly 10 ${difficulty} questions.`
        )
      }

      for (const [index, item] of items.entries()) {
        const [questionText, options, correctIndex, explanation] = item

        if (
          !questionText ||
          !Array.isArray(options) ||
          options.length !== 4 ||
          new Set(options).size !== 4 ||
          !Number.isInteger(correctIndex) ||
          correctIndex < 0 ||
          correctIndex > 3 ||
          !explanation
        ) {
          throw new Error(
            `Invalid question ${index + 1}: ${topic} (${difficulty}).`
          )
        }

        questions.push({
          questionText,
          options,
          correctAnswer: options[correctIndex],
          explanation,
          topic,
          difficulty,
        })
      }
    }
  }

  if (questions.length !== 150) {
    throw new Error(`Expected 150 questions; generated ${questions.length}.`)
  }

  return questions
}

async function seedQuestions() {
  let connectedHere = false

  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/smart_adaptive_learning'

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri)
      connectedHere = true
    }

    const questions = buildQuestions()
    let inserted = 0
    let updated = 0

    for (const question of questions) {
      const result = await Question.updateOne(
        {
          topic: question.topic,
          questionText: question.questionText,
        },
        {
          $set: {
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            difficulty: question.difficulty,
          },
          $setOnInsert: {
            topic: question.topic,
            questionText: question.questionText,
          },
        },
        { upsert: true, runValidators: true }
      )

      if (result.upsertedCount > 0) inserted++
      else if (result.modifiedCount > 0) updated++
    }

    console.log('Question seeding completed.')
    console.log(`Questions in seed bank: ${questions.length}`)
    console.log(`New questions inserted: ${inserted}`)
    console.log(`Existing seed questions updated: ${updated}`)
    console.log('Expected total: 5 topics × 3 difficulty levels × 10 = 150.')
  } catch (error) {
    console.error('Question seeding failed:', error.message)
    process.exitCode = 1
  } finally {
    if (connectedHere) {
      await mongoose.disconnect()
    }
  }
}

if (require.main === module) {
  seedQuestions()
}

module.exports = { buildQuestions, seedQuestions }
