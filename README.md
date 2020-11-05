# CSV Corpus Interface

### Synopsis

This interface is built to allow perusal and modification of CSV corpora.  Based on an existing corpus and configuration file, users can view that corpus as a table as well as determine which columns should be visible in the interface, which should be searchable, which should be retrievable, and which should be modifiable.  This is all to facilitate the completion and usage of such corpora, regardless of their specific contents.

### Setup & Administration

This project is run through Node.js, which can be downloaded for installation [here](https://nodejs.org/en/download/) or via command line as outlined [here](https://nodejs.org/en/download/package-manager/).  It was developed on version 14.13.1 and thus should be run using that version or later.

Before bringing up the website via the command `node app.js` (run from the top-level directory), three files need to exist: `data/config.csv` needs to be the exact path of a config file pointing to a *corpus file* and a *usage file*.  Examples of each exist at `data/lexiconP_Shortend_length_roots_frequencies.csv` and `data/usage.csv`, respectively.

The **config file** is a CSV containing six lines, each with a key and value (two fields) per line.  These lines determine the corpus and how it will be used:

1. `corpus_name` is the title of the corpus that will be displayed at the top of the web page.
2. `corpus_path` is the relative path to the *corpus file* -- it should be within a subdirectory of the project's top-level directory, ideally the `data/` subdirectory, but if you want the corpus to be publicly accessible in its raw format, put it in the `public/` subdirectory.
3. `corpus_delim` is the delimiter character used in the corpus file -- generally either a comma or a (literal) tab.
4. `usage_path` is the relative path to the *usage file* -- the contents of which are further explained below.
5. `usage_delim` is the delimiter character used in the usage file.
6. `output_delim` is the delimiter character to be used in any output files.

The **usage file** is a CSV containing a header followed by as many columns as there are rows in the *corpus file*.  The columns are as follows:

1. `index` is an integer (0+) representing the position of the column.
2. `header` is a string to be used as the label at the top of the column in any tables.
3. `longname` is a string to be used when referring to the value in the column outside of the table -- as the name suggests, generally a longer, full title as opposed to the truncated one that might be used in a table.
4. `rtl` is a boolean (0 or 1) representing whether the values in that column should be displayed right-to-left (1) or left-to-right (0).
5. `display` is a boolean representing whether the column should be displayed in the tables on the web page or omitted for brevity.
6. `search` is a boolean representing whether the column should be an option for searching the corpus -- i.e., whether the user can retrieve rows by that column's value.
7. `retrieve` is a boolean representing whether the column should be an option for retrieval -- i.e., whether the user can retrieve that value from a row based on a search.
8. `modify` is a boolean representing whether the column's values can be changed in the interface, and whether a blank field in that column should make a given row a candidate for completion.

Once Node.js is installed on the machine on which you want to run the interface and the three central files are all in order, you can simply execute the bash script `RUN` in the project's root directory. By default, this will run the site at the local port numbered *1035*, although you can specify a different port number by instead running `app.js {port # of choice}`. The tool can then be accessed at **localhost:{PORT #}** within any browser, or at **{URL OF CHOICE}:{PORT #}** if you are running it on a properly set-up server.

You can run `CHECK` (again, within the project's root directory) to ensure that everything is in fact running, or `KILL` to end the process.

### Usage

Once the interface is running, users are presented with four pages of content: *Info*, *View*, *Query*, and *Modify*.  The **Info** page gives similar instructions to those included here regarding the other pages, and the **View** tab is simply a table that displays the corpus as specified in the *corpus file* -- namely, the specific columns of it as specified in the *usage file*.

The **Query** page can be used to type out or upload a file with one such query per line.  The options under *Formats* determine which of the columns to search for matches (among those specified as searchable in the *usage file*).  The textbox under *Input* is where the queries can be entered, either by typing directly or by uploading a query file.  The contents of the textbox can also be saved or cleared.  The user can select any or all of the options under *Queries* to show up as columns in the output.  The *Neighborhood Density* and *Uniqueness Point* options are always available, while any options below that are determined by which columns have been designated as retrievable (again per the *usage file*).  Finally, the textbox under *Output*, generated by pressing the *Submit Query* button, is where the results appear -- results which can be saved to a local file (and which have the delimiter specified in *usage file*).  The results will always have *input* and *in_corpus* columns, the first repeating the input for reference and the second being a boolean representing whether there was an exact match in the corpus.

The **Modify** page can be used to fill out incomplete rows of the corpus.  The table displays one row at a time, limited to those for which at least one of the columns designated as modifiable (per the *usage file*) is empty or has the value *not_found*.  Regardless of whether they've been completed, each modifiable column can be changed, and these changes to the corpus are saved automatically.

### Credits

This interface was created by Ajda Gokcen for Marina Oganyan and Richard Wright.

### License

This code is licensed under GPL 3.0, shown in the file LICENSE.txt.

