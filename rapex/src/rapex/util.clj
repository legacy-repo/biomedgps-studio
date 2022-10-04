(ns rapex.util
  "Common utility functions useful throughout the codebase."
  (:require [clojure.java.io :as io]
            [clojure.string :as clj-str]
            [clojure.tools.logging :as log]
            [clj-uuid :as uuid]
            [local-fs.core :as fs-lib]
            [clj-time.coerce :as coerce]
            [clj-time.core :as t])
  (:import
   [org.apache.commons.compress.archivers.zip ZipFile ZipArchiveEntry]))

(defn one-or-many
  "Wraps a single element in a sequence; returns sequences as-is. In lots of situations we'd like to accept either a
  single value or a collection of values as an argument to a function, and then loop over them; rather than repeat
  logic to check whether something is a collection and wrap if not everywhere, this utility function is provided for
  your convenience.
    (u/one-or-many 1)     ; -> [1]
    (u/one-or-many [1 2]) ; -> [1 2]"
  [arg]
  (if ((some-fn sequential? set? nil?) arg)
    arg
    [arg]))

(defmacro varargs
  "Make a properly-tagged Java interop varargs argument. This is basically the same as `into-array` but properly tags
  the result.
    (u/varargs String)
    (u/varargs String [\"A\" \"B\"])"
  {:style/indent 1, :arglists '([klass] [klass xs])}
  [klass & [objects]]
  (vary-meta `(into-array ~klass ~objects)
             assoc :tag (format "[L%s;" (.getCanonicalName ^Class (ns-resolve *ns* klass)))))

(defmacro prog1
  "Execute `first-form`, then any other expressions in `body`, presumably for side-effects; return the result of
  `first-form`.
    (def numbers (atom []))
    (defn find-or-add [n]
      (or (first-index-satisfying (partial = n) @numbers)
          (prog1 (count @numbers)
            (swap! numbers conj n))))
    (find-or-add 100) -> 0
    (find-or-add 200) -> 1
    (find-or-add 100) -> 0
   The result of `first-form` is bound to the anaphor `<>`, which is convenient for logging:
     (prog1 (some-expression)
       (println \"RESULTS:\" <>))
  `prog1` is an anaphoric version of the traditional macro of the same name in
   [Emacs Lisp](http://www.gnu.org/software/emacs/manual/html_node/elisp/Sequencing.html#index-prog1)
   and [Common Lisp](http://www.lispworks.com/documentation/HyperSpec/Body/m_prog1c.htm#prog1).
  Style note: Prefer `doto` when appropriate, e.g. when dealing with Java objects."
  {:style/indent :defn}
  [first-form & body]
  `(let [~'<> ~first-form]
     ~@body
     ~'<>))

(defn join-path
  [root path]
  (let [root (clj-str/replace root #"/$" "")
        path (clj-str/replace path #"^/" "")]
    (str root "/" path)))

(defn delete-recursively [fname]
  (doseq [f (-> (clojure.java.io/file fname)
                (file-seq)
                (reverse))]
    (clojure.java.io/delete-file f)))

(defn uuid
  "These UUID's will be guaranteed to be unique and thread-safe regardless of clock precision or degree of concurrency."
  []
  (str (uuid/v1)))

(defn merge-diff-map
  "Insert into the old-map when it doesn't contains a key in default map."
  [old-map default-map]
  (let [diff-map (into {} (filter #(nil? ((key %) old-map)) default-map))]
    (merge old-map diff-map)))

(defn time->int
  [datetime]
  (coerce/to-long datetime))

(defn datetime
  []
  (.format (java.text.SimpleDateFormat. "yyyy-MM-dd HH:mm:ss")
           (new java.util.Date)))

(defn now
  "Get the current local datetime."
  ([offset]
   (t/to-time-zone (t/now) (t/time-zone-for-offset offset)))
  ([] (now 0)))

(defn call [this & that]
  (cond
    (string? this) (apply (resolve (symbol this)) that)
    (fn? this)     (apply this that)
    :else          (conj that this)))

;; Note that make-parents is called for every file. Tested with ZIP
;; with ca 80k files. Not significantly slower than testing here for
;; .isDirectory and only then create the parents. Keeping the nicer
;; code with this comment, then.
(defn unzip-file
  [zip-file to-dir]
  (log/infof "Extracting %s" zip-file)
  (log/debug "  to:" to-dir)
  (with-open [zipf (ZipFile. (io/file zip-file))]
    (doseq [entry (enumeration-seq (.getEntries zipf))
            :when (not (.isDirectory ^ZipArchiveEntry entry))
            :let  [zip-in-s (.getInputStream zipf entry)
                   out-file (io/file (str to-dir
                                          java.io.File/separator
                                          (.getName ^ZipArchiveEntry entry)))]]
      (log/trace "  ->" (.getName out-file))
      (io/make-parents out-file)
      (with-open [entry-o-s (io/output-stream out-file)]
        (io/copy zip-in-s entry-o-s)))))

(defn replace-path
  [filepath workdir]
  (cond
    ;; Absolute path
    (re-matches #"^file:\/\/\/.*" filepath) (clj-str/replace filepath #"^file:\/\/" "")
    ;; Relative path
    (re-matches #"^file:\/\/\..*" filepath) (fs-lib/join-paths workdir (clj-str/replace filepath #"^file:\/\/" ""))
    ;; File serivce
    :else filepath))

(defn rand-str [n]
  (clj-str/join
   (repeatedly n
               #(rand-nth "abcdefghijklmnopqrstuvwxyz0123456789"))))

(defn deep-merge [v & vs]
  ;; Details: https://gist.github.com/danielpcox/c70a8aa2c36766200a95#gistcomment-2677502
  (letfn [(rec-merge [v1 v2]
            (if (and (map? v1) (map? v2))
              (merge-with deep-merge v1 v2)
              v2))]
    (if (some identity vs)
      (reduce #(rec-merge %1 %2) v vs)
      (last vs))))
