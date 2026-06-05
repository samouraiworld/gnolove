package models

import "testing"

func TestBoardByID(t *testing.T) {
	if _, ok := BoardByID("nope"); ok {
		t.Fatal("BoardByID(unknown) should be !ok")
	}
	b, ok := BoardByID(DefaultBoardID)
	if !ok {
		t.Fatalf("BoardByID(%q) not found", DefaultBoardID)
	}
	if b.Number != 66 {
		t.Fatalf("default board number = %d, want 66", b.Number)
	}
}

func TestBoardMetasOmitsInternalMapping(t *testing.T) {
	metas := BoardMetas()
	if len(metas) != len(NotableBoards) {
		t.Fatalf("BoardMetas len = %d, want %d", len(metas), len(NotableBoards))
	}
	for _, m := range metas {
		if m.ID == "" || m.Label == "" || m.Owner == "" || m.Number == 0 {
			t.Fatalf("board meta missing required field: %+v", m)
		}
		if len(m.Areas) == 0 || len(m.Statuses) == 0 {
			t.Fatalf("board %q missing taxonomy (areas/statuses)", m.ID)
		}
	}
}

func TestEveryBoardHasCoherentAreaConfig(t *testing.T) {
	for _, b := range NotableBoards {
		switch b.AreaSource {
		case "field":
			if b.AreaField == "" {
				t.Fatalf("board %q is field-source but has no AreaField", b.ID)
			}
		case "label":
			if len(b.AreaLabels) == 0 {
				t.Fatalf("board %q is label-source but has no AreaLabels", b.ID)
			}
		default:
			t.Fatalf("board %q has invalid AreaSource %q", b.ID, b.AreaSource)
		}
	}
}
