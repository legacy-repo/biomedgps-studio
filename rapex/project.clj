(defproject com.github.rapex-lab/rapex "0.1.0-SNAPSHOT"
  :description "A platform for discovering Response to Air Pollution EXposure"
  :url "https://github.com/rapex-lab/rapex.git"
  :license {:name "EPL-2.0 OR GPL-2.0-or-later WITH Classpath-exception-2.0"
            :url "https://www.eclipse.org/legal/epl-2.0/"}
  :dependencies [[org.clojure/clojure "1.10.3"]
                 [ch.qos.logback/logback-classic "1.2.3"]
                 [org.clojure/clojure "1.10.1"]
                 [org.clojure/tools.cli "1.0.194"]
                 [org.clojure/tools.logging "1.1.0"]
                 [clojure.java-time "0.3.2"]
                 [mount "0.1.16"]
                 [nrepl "0.7.0"]
                 [cprop "0.1.17"]
                 [expound "0.8.9"]

                 ;; Database
                 [com.github.seancorfield/next.jdbc "1.3.828"]
                 [com.github.seancorfield/honeysql "2.3.928"]
                 [org.duckdb/duckdb_jdbc "0.5.0"]
                 [org.postgresql/postgresql "42.2.8"]
                 [luminus-migrations "0.6.6" :exclusions [org.clojure/clojure]]
                 [cheshire "5.9.0" :exclusions [org.clojure/clojure]]
                 [conman "0.8.4"
                  :exclusions [org.clojure/java.jdbc
                               org.clojure/clojure]]

                                  ;; Web Middleware
                 [ring-cors "0.1.13"]
                 [luminus-transit "0.1.2"]
                 [luminus/ring-ttl-session "0.3.3"]
                 [metosin/jsonista "0.2.6"]
                 [metosin/muuntaja "0.6.7"]
                 [metosin/reitit "0.5.2"]
                 [metosin/ring-http-response "0.9.1"]
                 [luminus-jetty "0.1.7"
                  :exclusions [clj-time joda-time org.clojure/clojure]]
                 [ring-webjars "0.2.0"]
                 [ring/ring-core "1.8.1"]
                 [ring/ring-defaults "0.3.2"]
                 [ring/ring-servlet "1.7.1"]

                 ;; Utility
                 [org.clojure/tools.reader "1.3.6"]
                 [danlentz/clj-uuid "0.1.9"]
                 [com.github.yjcyxky/local-fs "0.1.5"]
                 [com.github.yjcyxky/remote-fs "0.2.5"]
                 [com.github.yjcyxky/tservice-core "0.2.3"]

                 [rojure "0.2.0"]

                 ;; JSON/YAML/CSV
                 [com.fasterxml.jackson.core/jackson-core "2.11.0"]
                 [com.fasterxml.jackson.core/jackson-databind "2.11.0"]
                 [org.yaml/snakeyaml "1.23"]                                        ; YAML parser (required by liquibase)
                 [io.forward/yaml "1.0.11"                                          ; Clojure wrapper for YAML library SnakeYAML (which we already use for liquibase)
                  :exclusions [org.clojure/clojure
                               org.yaml/snakeyaml]]]

  :min-lein-version "2.0.0"

  :source-paths ["src"]
  :test-paths ["test"]
  :resource-paths ["resources"]
  :target-path "target/%s/"
  :main ^:skip-aot rapex.core

  :global-vars {*warn-on-reflection* true
                *assert* true}

  :repositories [["official" "https://repo1.maven.org/maven2/"]
                 ["central" "https://maven.aliyun.com/repository/central"]
                 ["jcenter" "https://maven.aliyun.com/repository/jcenter"]
                 ["clojars" "https://mirrors.tuna.tsinghua.edu.cn/clojars/"]
                 ["clojars-official" "https://repo.clojars.org"]]

  :plugin-repositories [["central" "https://maven.aliyun.com/repository/central"]
                        ["jcenter" "https://maven.aliyun.com/repository/jcenter"]
                        ["clojars" "https://mirrors.tuna.tsinghua.edu.cn/clojars/"]
                        ["clojars-official" "https://repo.clojars.org"]]

  :release-tasks [["change" "version" "leiningen.release/bump-version"]
                  ["change" "version" "leiningen.release/bump-version" "release"]
                  ["changelog" "release"]]

  :uberwar
  {:handler rapex.handler/app
   :init rapex.handler/init
   :destroy rapex.handler/destroy
   :name "rapex.war"}

  :codox {:output-path "docs"
          :source-uri "https://github.com/rapex-lab/rapex/blob/v{version}/{filepath}#L{line}"}

  :profiles
  {:uberjar {:omit-source false
             :aot :all
             :uberjar-name "rapex.jar"
             :source-paths ["env/prod"]
             :resource-paths ["env/prod/resources"]}

   :dev           [:project/dev :profiles/dev]
   :test          [:project/dev :project/test :profiles/test]

   :project/dev  {:jvm-opts ["-XX:+IgnoreUnrecognizedVMOptions" "-Dconf=dev-config.edn"]
                  :dependencies [[directory-naming/naming-java "0.8"]
                                 [luminus-jetty "0.1.9"]
                                 [pjstadig/humane-test-output "0.10.0"]
                                 [prone "2020-01-17"]
                                 [ring/ring-devel "1.8.1"]
                                 [ring/ring-mock "0.4.0"]]
                  :plugins      [[com.jakemccrary/lein-test-refresh "0.24.1"]
                                 [jonase/eastwood "0.3.5"]
                                 [lein-pprint "1.3.2"]]

                  :source-paths ["env/dev"]
                  :resource-paths ["env/dev/resources"]
                  :repl-options {:init-ns user
                                 :timeout 120000}
                  :injections [(require 'pjstadig.humane-test-output)
                               (pjstadig.humane-test-output/activate!)]}
   :project/test {:jvm-opts ["-Dconf=test-config.edn"]
                  :resource-paths ["env/test/resources"]}
   :profiles/dev {}
   :profiles/test {}})
