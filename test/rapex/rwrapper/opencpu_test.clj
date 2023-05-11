(ns rapex.rwrapper.opencpu-test
  (:require [rapex.rwrapper.opencpu :as ocpu]
            [clojure.test :refer :all]
            [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [clojure.string :as clj-str]))

(defn setup
  []
  (log/info "Setup test environment")
  (ocpu/setup-ocpu-api-service "http://localhost:5656"))

(defn teardown
  []
  (log/info "Teardown test environment"))

(use-fixtures :each setup teardown)

(deftest test-ocpu-api-service
  (testing "Test the ocpu api service"
    (ocpu/setup-ocpu-api-service "http://localhost:5656")
    (is (= "http://localhost:5656" @ocpu/ocpu-api-service))
    (is (ocpu/service-ok?))))