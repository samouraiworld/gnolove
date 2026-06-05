package sync

import (
	"testing"

	"github.com/samouraiworld/topofgnomes/server/models"
)

func TestDeriveArea(t *testing.T) {
	fieldBoard := models.BoardConfig{AreaSource: "field", AreaField: "Main Area"}
	labelBoard := models.BoardConfig{
		AreaSource: "label",
		AreaLabels: map[string]string{"a/vm": "VM", "a/ux": "UX"},
	}

	labels := func(names ...string) []models.NotablePRLabel {
		out := make([]models.NotablePRLabel, len(names))
		for i, n := range names {
			out[i] = models.NotablePRLabel{Name: n}
		}
		return out
	}

	cases := []struct {
		name   string
		board  models.BoardConfig
		field  string
		labels []models.NotablePRLabel
		want   string
	}{
		{"field source uses the field value", fieldBoard, "Blockchain", labels("a/vm"), "Blockchain"},
		{"field source ignores labels", fieldBoard, "", labels("a/vm"), ""},
		{"label source maps a matching label", labelBoard, "anything", labels("docs", "a/vm"), "VM"},
		{"label source ignores the field value", labelBoard, "Blockchain", labels("a/ux"), "UX"},
		{"label source returns empty when no label matches", labelBoard, "", labels("docs", "bug"), ""},
		{"label source returns empty when no labels", labelBoard, "", nil, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := deriveArea(tc.board, tc.field, tc.labels); got != tc.want {
				t.Fatalf("deriveArea = %q, want %q", got, tc.want)
			}
		})
	}
}

func TestDeriveAreaLabelFirstMatchWins(t *testing.T) {
	board := models.BoardConfig{
		AreaSource: "label",
		AreaLabels: map[string]string{"a/vm": "VM", "a/blockchain": "Blockchain"},
	}
	// Order follows the label slice; the first matching label decides.
	got := deriveArea(board, "", []models.NotablePRLabel{{Name: "a/blockchain"}, {Name: "a/vm"}})
	if got != "Blockchain" {
		t.Fatalf("deriveArea = %q, want Blockchain (first match)", got)
	}
}
