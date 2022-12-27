<template>
  <div>
    <textarea v-model='sql' id="editor"/>
    <div style='display: flex; flex-direction: row; gap: 1rem; padding: .5rem 0; align-items: center'>
      <q-btn id="execute" color='primary' outline @click='execEditorContents'>Execute</q-btn>
      <!-- <button id='savedb' class="btn btn-secondary btn-sm">Save the db</button> -->
      <!-- <label class="button">Load an SQLite database file: <input type='file' id='dbfile' /></label> -->
    </div>
    <div id="error" class="error"></div>
    <q-table
      v-if='rows.length'
      :rows='rows'
      dense
      wrap-cells
      :rows-per-page-options='[10, 50, 100, 0]'
    />
    <pre id="output">Results will be displayed here</pre>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import helpersMixin from '../utils/mixin'
import {dbQuery} from '../query'
import CodeMirror from 'codemirror/lib/codemirror.js'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/sql/sql.js'
import 'codemirror/theme/dracula.css'


export default defineComponent({
  name: 'TheSqlEditor',
  mixins: [helpersMixin],

  components: {
  },

  data() {
    return {
      codeEditor: null,
      tictime: null,
      sql: 'SELECT * FROM nostr_events;\n-- SELECT * FROM nostr_users;',
      // sql: 'SELECT * FROM nostr;',
      // results: [],
      rows: [],
      // rowKey: 'id',
      // columns: [],
      tab: 'keyConverter',
      keys: {
        hex: '',
        bech32: ''
      }
    }
  },

  computed: {
    editor() {
      return document.getElementById('editor')
    },
    commands() {
      return document.getElementById('commands')
    },
    executeButton() {
      return document.getElementById('execute')
    },
    output() {
      return document.getElementById('output')
    },
    error() {
      return document.getElementById('error')
    }
  },

  mounted() {
    this.codeEditor = CodeMirror.fromTextArea(this.editor, {
      mode: 'text/x-sql',
      theme: 'dracula',
      viewportMargin: Infinity,
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      matchBrackets: true,
      autofocus: true,
      extraKeys: {
        'Ctrl-Enter': this.execEditorContents,
        // "Ctrl-S": savedb,
      }
    })
  },

  activated() {
  },

  deactivated() {
  },

  methods: {
  // Execute the commands when the button is clicked
    execEditorContents() {
      console.log('sql', this.codeEditor.getValue())
      this.noerror()
      this.rows = []
      this.execute(this.codeEditor.getValue() + ';')
    },

    // Run a command in the database
    async execute(sql) {
      this.tic()
      this.output.textContent = 'Fetching results...'
      let results
        results = await dbQuery(sql)
      // try {
      //   results = await dbQuery(sql)
      // } catch (e) {
      //   this.displayError(e)
      // }
      this.toc('Executing SQL')

      this.tic()
      this.output.innerHTML = ''
      if (!results || !results.length) {
        this.print('0 rows returned')
        return
      }
      this.rows = results
      // this.output.appendChild(this.createTable(results))
      // console.log(results)
      this.toc('Displaying results')
    },

    // Connect to the HTML element we 'print' to
    print(text) {
      this.output.innerHTML = text.replace(/\n/g, '<br>')
    },
    displayError(e) {
      console.log(e)
      this.error.style.height = '2em'
      this.error.textContent = e.message
    },

    noerror() {
      this.error.style.height = '0'
    },

    // concatTableValues(vals, tagName) {
    //     if (vals.length === 0) return ''
    //     var open = '<' + tagName + '>', close = '</' + tagName + '>'
    //     return open + vals.join(close + open) + close
    //   },
    // Create an HTML table
    // createTable(data) {
    //   if (data.length === 0) return
    //   console.log(data)
    //   let columns = Object.keys(data[0])
    //   // this.rowKey = columns[0]
    //   // this.columns = columns
    //   let values = data.map(row => Object.values(row))
    //   console.log('columns:', columns, 'values:', values)
    //   var tbl = document.createElement('table')
    //   var html = '<thead>' + this.concatTableValues(columns, 'th') + '</thead>'
    //   var rows = values.map(v => this.concatTableValues(v, 'td'))
    //   // this.rows = values
    //   html += '<tbody>' + this.concatTableValues(rows, 'tr') + '</tbody>'
    //   tbl.innerHTML = html
    //   return tbl
    // },

    // Performance measurement functions
    tic() { this.tictime = Date.now() },

    toc(msg) {
      let took = Date.now() - this.tictime
      console.log((msg || 'toc') + ': ' + took + 'ms')
    },
  }
})
</script>

<style lang='scss' scoped>
.q-tabs {
  border-bottom: 1px solid $accent
}
</style>
