objdump --no-show-raw-insn \
        -M intel           \
        -Dj .text $(which ls)
             # sed -n '/<\.text>/, $ p'      | 
             awk '{$1 = ""; print}'        |
             sed '1d'                      |
             awk '{print $1}'              |
             sort                          |
             uniq -c
