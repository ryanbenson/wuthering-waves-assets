ARGS ?=

.PHONY: install characters weapons echoes enemies all help

help:
	@echo "Wuthering Waves Assets CLI"
	@echo ""
	@echo "Setup:"
	@echo "  make install          Install npm dependencies"
	@echo ""
	@echo "Download (pass ARGS for flags, e.g. ARGS=\"--dry-run\"):"
	@echo "  make characters       Download character portraits (PNG)"
	@echo "  make weapons          Download weapon icons (PNG)"
	@echo "  make echoes           Download echo icons (WebP)"
	@echo "  make enemies          Download enemy icons (WebP)"
	@echo "  make all              Download everything"
	@echo ""
	@echo "Flags: --dry-run  preview without downloading"
	@echo "       --force     overwrite existing files"

install:
	npm install

characters:
	node bin/wwaves-assets.js characters $(ARGS)

weapons:
	node bin/wwaves-assets.js weapons $(ARGS)

echoes:
	node bin/wwaves-assets.js echoes $(ARGS)

enemies:
	node bin/wwaves-assets.js enemies $(ARGS)

all:
	node bin/wwaves-assets.js all $(ARGS)
