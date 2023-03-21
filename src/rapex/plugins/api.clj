(ns rapex.plugins.api
  (:require [camel-snake-kebab.core :refer [->kebab-case ->PascalCase]]
            [clojure.string :as clj-str]))

(defn defmenu
  "Generate an ant-design menu.
   
   NOTE: If you specify component and routes simultaneously,
         the routes will be ignored."
  [plugin-name menu-key & {:keys [icon component routes]}]
  (assert (or component routes) "component or routes must exists.")
  (assert (empty? (filter (fn [route] (:routes route)) routes)) "Don't generate menu more than two layers.")
  (let [formated-name (->kebab-case menu-key)
        plugin-prefix (->PascalCase (format "%s_plugin" plugin-name))
        name {:name formated-name}
        path {:path (if component
                      (format "/%s/%s" (->kebab-case plugin-prefix)
                              (clj-str/lower-case (->PascalCase component)))
                      (format "/%s" (->kebab-case plugin-prefix)))}
        icon {:icon (or (->PascalCase icon) "HomeOutlined")}
        item (if component
               {:component (->PascalCase (format "%s_%s" plugin-prefix component))}
               {:routes routes})]
    (merge {:key formated-name} path name icon item)))

(comment
  (defmenu "rapex" "quick-start" :icon "home-outlined" :component "welcome")
  (defmenu "rapex" "QuickStart" :icon "home_outlined" :component "Welcome")

  (defmenu "rapex" "expression-analysis"
    :icon "appstore-add-outlined"
    :routes [(defmenu "rapex" "single-gene"
               :icon "sliders-outlined" :component "single-gene")])

  (defmenu "rapex" "expression-analysis"
    :icon "appstore-add-outlined"
    :routes [(defmenu "rapex" "single-gene"
               :icon "sliders-outlined"
               :routes [(defmenu "rapex" "single-gene"
                          :icon "sliders-outlined" :component "single-gene")])]))