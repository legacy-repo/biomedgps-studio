;; (ns rapex.R.fastr-context
;;   (:import [org.graalvm.polyglot Context]))

;; (def conn (atom nil))

;; (defn get-context
;;   ^Context []
;;   (if @conn
;;     @conn
;;     (let [c (-> (Context/newBuilder (into-array ["R"]))
;;                 (.allowAllAccess true)
;;                 (.build))]
;;       (reset! conn c)
;;       c)))

;; (defmacro swallow-exceptions [& body]
;;   `(try ~@body (catch Exception e#)))

;; (defn close
;;   []
;;   (when @conn
;;     (.close @conn)
;;     (reset! conn nil)))

;; (defmacro with-context
;;   [& forms]
;;   `(do
;;      (get-context)
;;      ~@forms))

;; (defn eval-R
;;   [^String code]
;;   (.eval (get-context) "R" code))

;; (comment
;;   (eval-R "2 + 2")

;;   (with-context
;;     (def a (.asLong (eval-R "2 + 2")))
;;     (* a (.asLong (eval-R "4 ^ 5")))))
