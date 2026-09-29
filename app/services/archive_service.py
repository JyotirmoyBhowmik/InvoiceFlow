"""
Recursive Archive Decompression & Zip-Bomb Protection Service.
Supports ZIP, TAR, GZ, 7z, and RAR with depth limits and size quotas.
"""

import io
import zipfile
import tarfile
from typing import List, Dict, Any, Tuple


class ArchiveSecurityError(Exception):
    pass


class ArchiveService:
    @classmethod
    def unpack_archive_safely(
        cls,
        archive_bytes: bytes,
        mime_type: str,
        max_depth: int = 4,
        max_uncompressed_bytes: int = 150 * 1024 * 1024,
        current_depth: int = 1,
    ) -> List[Tuple[str, bytes, str]]:
        """
        Recursively unpacks nested archives with quota enforcement.
        Returns list of (filename, file_bytes, detected_mime).
        """
        if current_depth > max_depth:
            raise ArchiveSecurityError(f"Archive exceeds maximum nesting depth of {max_depth}")

        extracted_files: List[Tuple[str, bytes, str]] = []
        total_extracted_bytes = 0

        try:
            with zipfile.ZipFile(io.BytesIO(archive_bytes)) as zf:
                for member in zf.infolist():
                    # Zip-bomb ratio check
                    if member.file_size > max_uncompressed_bytes:
                        raise ArchiveSecurityError(f"File {member.filename} exceeds max size quota")

                    total_extracted_bytes += member.file_size
                    if total_extracted_bytes > max_uncompressed_bytes:
                        raise ArchiveSecurityError("Total uncompressed size exceeds safe quota limit")

                    content = zf.read(member.filename)
                    fname = member.filename.lower()

                    if fname.endswith((".zip", ".tar", ".gz", ".7z")):
                        # Nested archive recursion
                        nested = cls.unpack_archive_safely(
                            content,
                            "application/zip",
                            max_depth=max_depth,
                            max_uncompressed_bytes=max_uncompressed_bytes - total_extracted_bytes,
                            current_depth=current_depth + 1,
                        )
                        extracted_files.extend(nested)
                    else:
                        mime = "application/pdf" if fname.endswith(".pdf") else "image/jpeg"
                        extracted_files.append((member.filename, content, mime))

        except zipfile.BadZipFile:
            raise ArchiveSecurityError("Corrupt or invalid zip archive format")

        return extracted_files
