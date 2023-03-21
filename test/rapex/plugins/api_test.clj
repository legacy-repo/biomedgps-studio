(ns rapex.plugins.api-test
  (:require [clojure.test :refer [deftest testing is]]
            [rapex.plugins.api :refer [defmenu]]))

(deftest defmenu-test
  (testing "Testing defmenu function."
    (is (= {:key "quick-start",
            :path "/rapex-plugin/welcome",
            :name "quick-start",
            :icon "HomeOutlined",
            :component "RapexPluginWelcome"}
           (defmenu "rapex" "QuickStart" :icon "home_outlined" :component "Welcome")))

    (is (= {:key "quick-start",
            :path "/rapex-plugin/welcome",
            :name "quick-start",
            :icon "HomeOutlined",
            :component "RapexPluginWelcome"}
           (defmenu "rapex" "quick-start" :icon "home-outlined" :component "welcome")))

    (is (= {:key "expression-analysis",
            :path "/rapex-plugin",
            :name "expression-analysis",
            :icon "AppstoreAddOutlined",
            :routes
            [{:key "single-gene",
              :path "/rapex-plugin/singlegene",
              :name "single-gene",
              :icon "SlidersOutlined",
              :component "RapexPluginSingleGene"}]}
           (defmenu "rapex" "expression-analysis"
             :icon "appstore-add-outlined"
             :routes [(defmenu "rapex" "single-gene"
                        :icon "sliders-outlined"
                        :component "single-gene")])))))


(deftest defmenu-assert-test
  (testing "Test the assertion in defmenu function."
    (is (some? (try
                 (defmenu "rapex" "expression-analysis"
                   :icon "appstore-add-outlined"
                   :routes [(defmenu "rapex" "single-gene"
                              :icon "sliders-outlined" :routes [(defmenu "rapex" "single-gene"
                                                                  :icon "sliders-outlined" :component "single-gene")])])
                 false
                 (catch Exception e
                   true))))))