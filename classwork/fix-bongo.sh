input_file="bongo.png"
output_file="bongo_original.png"
temp_file=$(mktemp)

dd if="$input_file" of="$temp_file" bs=1 count=10240 status=none

dd if="$input_file" of="$temp_file" bs=1 skip=$((10240 + 102400)) seek=10240 status=none

mv "$temp_file" "$output_file"